from tethys_apps.base import TethysAppBase, url_map_maker


class NFIEiRODSExplorer(TethysAppBase):
    """
    Tethys app class for NFIE iRODS Explorer.
    """

    name = 'NFIE iRODS Explorer'
    index = 'nfie_irods_explorer:home'
    icon = 'nfie_irods_explorer/images/icon.gif'
    package = 'nfie_irods_explorer'
    root_url = 'nfie-irods-explorer'
    color = '#e74c3c'
        
    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (UrlMap(name='home',
                           url='nfie-irods-explorer',
                           controller='nfie_irods_explorer.controllers.home'),
                    UrlMap(name='get_dropdown_contents_ajax',
                           url='nfie-irods-explorer/get-dropdown-contents',
                           controller='nfie_irods_explorer.controllers_ajax.get_dropdown_contents'),
                    UrlMap(name='upload_to_hydroshare_ajax',
                           url='nfie-irods-explorer/upload-to-hydroshare',
                           controller='nfie_irods_explorer.controllers_ajax.upload_to_hydroshare')
                    )
        return url_maps
