#NFIE iRODS Explorer
*tethysapp-nfie_irods_explorer*

**This app is created to run in the Teyths Platform programming environment.
See: https://github.com/CI-WATER/tethys and http://docs.tethys.ci-water.org**

##Prerequisites:
- Tethys Platform (CKAN, PostgresQL, GeoServer)
- hs_restclient (python library)

##Install hs_restclient:
See: http://hs-restclient.readthedocs.org/en/latest/#installation

##Installation:
Clone the app into the directory you want:
```
$ git clone https://github.com/shawncrawley/tethysapp-nfie_irods_explorer.git
$ cd tethysapp-nfie_irods_explorer
```
Then install the app in Tethys Platform.

###Installation for App Development:
```
$ . /usr/lib/tethys/bin/activate
$ cd tethysapp-nfie_irods_explorer
$ python setup.py develop
```
###Installation for Production:
```
$ . /usr/lib/tethys/bin/activate
$ cd tethysapp-nfie_irods_explorer
$ python setup.py install
$ tethys manage collectstatic
```
Restart the Apache Server:
See: http://docs.tethys.ci-water.org/en/1.1.0/production/installation.html#enable-site-and-restart-apache

##Updating the App:
Update the local repository and Tethys Platform instance.
```
$ . /usr/lib/tethys/bin/activate
$ cd tethysapp-nfie_irods_explorer
$ git pull
```
Restart the Apache Server:
See: http://tethys-platform.readthedocs.org/en/1.0.0/production.html#enable-site-and-restart-apache