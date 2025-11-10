
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~>2.0"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "azuread" {
}

# Retrieve info about the logged-in Azure account
data "azurerm_client_config" "current" {}

# --------------------------------------------------------
# 1. Create Resource Group
# --------------------------------------------------------
resource "azurerm_resource_group" "vmeet_rg" {
  name     = "V-Meet-RG"
  location = "eastasia"
}

# --------------------------------------------------------
# 2. Create Azure SQL Server
# --------------------------------------------------------
resource "azurerm_mssql_server" "vmeet_server" {
  name                         = "vmeetserver"
  resource_group_name           = azurerm_resource_group.vmeet_rg.name
  location                      = azurerm_resource_group.vmeet_rg.location
  version                       = "12.0"
  administrator_login           = "CloudSAd19cff38"
  administrator_login_password  = "Vmeet@pass"
}

# --------------------------------------------------------
# 3. Create Azure SQL Database
# --------------------------------------------------------
resource "azurerm_mssql_database" "vmeet_db" {
  name           = "V-Meet"
  server_id      = azurerm_mssql_server.vmeet_server.id
  sku_name       = "S0"
}

# --------------------------------------------------------
# 4. Run SQL Initialization Script
# --------------------------------------------------------
resource "null_resource" "init_sql" {
  depends_on = [azurerm_mssql_database.vmeet_db]

  provisioner "local-exec" {
    command = format(
      "sqlcmd -S %s -U %s -P %s -d %s -i init_db.sql",
      azurerm_mssql_server.vmeet_server.fully_qualified_domain_name,
      azurerm_mssql_server.vmeet_server.administrator_login,
      azurerm_mssql_server.vmeet_server.administrator_login_password,
      azurerm_mssql_database.vmeet_db.name
    )
  }
}

# --------------------------------------------------------
# 5. Create a new Azure AD App Registration & Service Principal
# --------------------------------------------------------
resource "azuread_application" "vmeet_app" {
  display_name = "V-Meet-App"
}

resource "azuread_service_principal" "vmeet_sp" {
  application_id = azuread_application.vmeet_app.application_id
}

resource "azuread_service_principal_password" "vmeet_sp_password" {
  service_principal_id = azuread_service_principal.vmeet_sp.id
  end_date_relative    = "8760h" # 1 year validity
}

# --------------------------------------------------------
# 6. Write all credentials to .env file automatically
# --------------------------------------------------------
resource "null_resource" "write_env" {
  depends_on = [
    azurerm_mssql_database.vmeet_db,
    azuread_service_principal_password.vmeet_sp_password
  ]

  provisioner "local-exec" {
    command = <<EOT
      echo AZURE_SUBSCRIPTION_ID=${data.azurerm_client_config.current.subscription_id} > ../.env
      echo AZURE_TENANT_ID=${data.azurerm_client_config.current.tenant_id} >> ../.env
      echo AZURE_CLIENT_ID=${azuread_application.vmeet_app.application_id} >> ../.env
      echo AZURE_CLIENT_SECRET=${azuread_service_principal_password.vmeet_sp_password.value} >> ../.env
      echo AZURE_RESOURCE_GROUP=${azurerm_resource_group.vmeet_rg.name} >> ../.env
      echo AZURE_LOCATION=${azurerm_resource_group.vmeet_rg.location} >> ../.env
      echo SQL_CONNECTION_STRING="Server=${azurerm_mssql_server.vmeet_server.fully_qualified_domain_name};Database=${azurerm_mssql_database.vmeet_db.name};User Id=${azurerm_mssql_server.vmeet_server.administrator_login};Password=${azurerm_mssql_server.vmeet_server.administrator_login_password};" >> ../.env
    EOT
  }
}

# --------------------------------------------------------
# 7. Terraform Output (for console visibility)
# --------------------------------------------------------
output "azure_env_details" {
  value = {
    AZURE_SUBSCRIPTION_ID = data.azurerm_client_config.current.subscription_id
    AZURE_TENANT_ID       = data.azurerm_client_config.current.tenant_id
    AZURE_CLIENT_ID       = azuread_application.vmeet_app.application_id
    AZURE_CLIENT_SECRET   = azuread_service_principal_password.vmeet_sp_password.value
    AZURE_RESOURCE_GROUP  = azurerm_resource_group.vmeet_rg.name
    AZURE_LOCATION        = azurerm_resource_group.vmeet_rg.location
    SQL_CONNECTION_STRING = "Server=${azurerm_mssql_server.vmeet_server.fully_qualified_domain_name};Database=${azurerm_mssql_database.vmeet_db.name};User Id=${azurerm_mssql_server.vmeet_server.administrator_login};Password=${azurerm_mssql_server.vmeet_server.administrator_login_password};"
  }
  sensitive = true
}
