import { DefaultAzureCredential } from "@azure/identity";
import { ComputeManagementClient } from "@azure/arm-compute";
import { NetworkManagementClient } from "@azure/arm-network";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
const resourceGroup = process.env.AZURE_RESOURCE_GROUP;
const location = process.env.AZURE_LOCATION; // must be one of your allowed regions like 'southeastasia'
const credential = new DefaultAzureCredential();

const vmConfigs = JSON.parse(fs.readFileSync("./vmConfigs.json"));

// 🧼 Sanitize Azure resource names
function sanitizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/[^a-zA-Z0-9_.-]/g, "") // remove invalid chars
    .substring(0, 80); // Azure limit
}

// 🧱 Delete a VM and its related resources
export async function deleteVM(vmName) {
  const safeVmName = sanitizeName(vmName);
  console.log(`🗑️ Deleting VM: ${safeVmName}`);

  try {
    const computeClient = new ComputeManagementClient(credential, subscriptionId);
    const networkClient = new NetworkManagementClient(credential, subscriptionId);

    // Delete VM
    await computeClient.virtualMachines.beginDeleteAndWait(resourceGroup, safeVmName);
    console.log(`✅ VM ${safeVmName} deleted.`);

    // Delete related resources
    await networkClient.networkInterfaces.beginDeleteAndWait(resourceGroup, `${safeVmName}-nic`);
    await networkClient.publicIPAddresses.beginDeleteAndWait(resourceGroup, `${safeVmName}-ip`);
    await networkClient.virtualNetworks.beginDeleteAndWait(resourceGroup, `${safeVmName}-vnet`);
    console.log(`🧹 Cleaned up resources for ${safeVmName}.`);
  } catch (err) {
    console.error(`❌ Failed to delete VM ${safeVmName}:`, err.message);
  }
}

// 🏗️ Create VM function
export async function createVM(vmType, vmName, adminUsername, adminPassword) {
  const config = vmConfigs[vmType];
  if (!config) throw new Error(`Invalid VM type: ${vmType}`);

  const networkClient = new NetworkManagementClient(credential, subscriptionId);
  const computeClient = new ComputeManagementClient(credential, subscriptionId);

  // Sanitize names for Azure
  const safeVmName = sanitizeName(vmName);

  console.log(`🚀 Creating VM: ${safeVmName} (${vmType}) for ${adminUsername}`);

  // ✅ Create a valid Windows computer name (≤15 chars, no special chars)
  let computerName = safeVmName.replace(/[^a-zA-Z0-9-]/g, "");
  if (/^\d+$/.test(computerName)) computerName = "vm" + computerName;
  computerName = computerName.substring(0, 15);

  // 1️⃣ Create Virtual Network
  const vnetName = `${safeVmName}-vnet`;
  const subnetName = `${safeVmName}-subnet`;

  await networkClient.virtualNetworks.beginCreateOrUpdateAndWait(resourceGroup, vnetName, {
    location,
    addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
    subnets: [{ name: subnetName, addressPrefix: "10.0.0.0/24" }]
  });

  const subnetInfo = await networkClient.subnets.get(resourceGroup, vnetName, subnetName);

  // 2️⃣ Public IP (Standard SKU — required for student subscriptions)
  const publicIPName = `${safeVmName}-ip`;
  const publicIP = await networkClient.publicIPAddresses.beginCreateOrUpdateAndWait(
    resourceGroup,
    publicIPName,
    {
      location,
      sku: { name: "Standard" }, // ✅ FIX
      publicIPAllocationMethod: "Static", // ✅ Required for Standard
      publicIPAddressVersion: "IPv4"
    }
  );

  // 3️⃣ NSG (Allow RDP)
  const nsgName = `${safeVmName}-nsg`;
  await networkClient.networkSecurityGroups.beginCreateOrUpdateAndWait(resourceGroup, nsgName, {
    location,
    securityRules: [
      {
        name: "Allow-RDP",
        protocol: "Tcp",
        direction: "Inbound",
        sourceAddressPrefix: "*",
        destinationPortRange: "3389",
        access: "Allow",
        priority: 1000,
        sourcePortRange: "*",
        destinationAddressPrefix: "*"
      }
    ]
  });

  // 4️⃣ NIC
  const nicName = `${safeVmName}-nic`;
  const nic = await networkClient.networkInterfaces.beginCreateOrUpdateAndWait(
    resourceGroup,
    nicName,
    {
      location,
      ipConfigurations: [
        {
          name: `${safeVmName}-ipconfig`,
          subnet: { id: subnetInfo.id },
          publicIPAddress: { id: publicIP.id }
        }
      ],
      networkSecurityGroup: {
        id: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/networkSecurityGroups/${nsgName}`
      }
    }
  );

  // 5️⃣ Create Windows VM with personalized credentials
  const vmParams = {
    location,
    hardwareProfile: { vmSize: "Standard_B1s" }, // minimal cost, enough for testing
    storageProfile: {
      imageReference: {
        publisher: "MicrosoftWindowsServer",
        offer: "WindowsServer",
        sku: "2022-Datacenter",
        version: "latest"
      },
      osDisk: {
        createOption: "FromImage",
        managedDisk: { storageAccountType: "Standard_LRS" }
      }
    },
    osProfile: {
      computerName,
      adminUsername,
      adminPassword,
      customData: Buffer.from(config.installScript, "utf-8").toString("base64")
    },
    networkProfile: { networkInterfaces: [{ id: nic.id }] }
  };

  await computeClient.virtualMachines.beginCreateOrUpdateAndWait(resourceGroup, safeVmName, vmParams);

  // 6️⃣ Fetch Public IP
  const publicIpDetails = await networkClient.publicIPAddresses.get(resourceGroup, publicIPName);
  const ipAddress = publicIpDetails.ipAddress;

  console.log(`✅ VM ${safeVmName} created successfully with IP ${ipAddress}`);

  return { ipAddress, vmName: safeVmName };
}
