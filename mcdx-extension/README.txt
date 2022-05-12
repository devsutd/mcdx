MCDX ERROR TROUBLESHOOTING

ERROR CODE: ETIMEOUT
This error is thrown when connection to the sql server is timed out. To fix it, open services.msc, go to SQL Server Browser, and make sure it is both configured as automatic startup and started.

ERROR CODE: EINSTLOOKUP
This error is thrown when it is imposible to search for the server given in the connection string. To fix it, open the SQL Server Configuration Manager (Windows + r, SQLServerManagerXX.msc), open the SQL Server Network Configuration, and enable the TPC/IP Protocol
For the SQLServerManagerXX version:
SQL SERVER 2019 ------------- SQLServerManager15.msc
SQL SERVER 2017 ------------- SQLServerManager14.msc
SQL SERVER 2016 ------------- SQLServerManager13.msc
SQL SERVER 2014 ------------- SQLServerManager12.msc
SQL SERVER 2012 ------------- SQLServerManager11.msc

ERROR CODE: ESOCKET
This error is thrown when the server either has no port open or is not running. To fix it, make sure that the SQL Server service responsible for that instance is running properly by opening services.msc and searching for it.

ERROR CODE: ELOGIN
This error is a login information error. Make sure that the user id and password in your connection string match those of your server. Please remember that this extension doesn't support integrated security yet.
