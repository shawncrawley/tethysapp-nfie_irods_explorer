import os
import sys
from setuptools import setup, find_packages
from tethys_apps.app_installation import custom_develop_command, custom_install_command

### Apps Definition ###
app_package = 'nfie_irods_explorer'
release_package = 'tethysapp-' + app_package
app_class = 'nfie_irods_explorer.app:NFIEiRODSExplorer'
app_package_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tethysapp', app_package)

### Python Dependencies ###
dependencies = ['requests', 'hs_restclient', 'django',]

setup(
    name=release_package,
    version='0.0',
    description='',
    long_description='',
    keywords='',
    author='Shawn Crawley',
    author_email='scrawley@byu.edu',
    url='',
    license='',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=['tethysapp', 'tethysapp.' + app_package],
    include_package_data=True,
    zip_safe=False,
    install_requires=dependencies,
    cmdclass={
        'install': custom_install_command(app_package, app_package_dir, dependencies),
        'develop': custom_develop_command(app_package, app_package_dir, dependencies)
    }
)
