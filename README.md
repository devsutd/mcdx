## MCDX - Visual Studio Code Extension

A Visual Studio Code extension for Salesforce Marketing Cloud

### Setup

Place your manifest in your Marketing Cloud source working folder. Manifest must include information from your API Integration Installed Packages, and also the tenant url.

Folder Ids for data extensions, content, and queries are the starting point Ids from which to recursively download elements.

```json
{
    "tenant": "mc2h-lnxnnnnnnnnnnnnnnnnnnn",
    "business-units": [
        {
            "bu-id": 12345678,
            "bu-name": "Business Unit A",
            "client-id": "**********",
            "client-secret": "**********",
            "content-builder-folders": [3850],
            "data-extension-folders": [1185],
            "query-folders": [],
            "connection-string": "Server=localhost\\SQLEXPRESS01;Database=Test A; User Id=testslim; Password=testslim"
        },
		{
            "bu-id": 12345679,
            "bu-name": "Business Unit B",
            "client-id": "********",
            "client-secret": "**********",
            "content-builder-folders": [291105, 20913],
            "data-extension-folders": [5763, 291146],
            "query-folders": [4544],
            "connection-string": "Server=localhost\\SQLEXPRESS01;Database=Test B; User Id=testslim; Password=testslim"
        }
    ]
}
```