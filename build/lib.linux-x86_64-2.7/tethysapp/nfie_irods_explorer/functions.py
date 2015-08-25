import requests
from datetime import datetime
from requests.auth import HTTPBasicAuth


def irods_query(selection_path):

    resource = 'collection' if '?COLLECTION' in selection_path else 'dataObject'

    object_type_index = selection_path.rfind('?')
    selection_path = selection_path[0:object_type_index]
    selection_path = selection_path.replace("%%", "/")

    headers = {'Accept': 'application/json'}
    auth = HTTPBasicAuth('shawncrawley', 'shawncrawley')
    url = 'http://nfie.hydroshare.org:8080/irods-rest/rest/' + resource + selection_path + '?listing=true'

    r = requests.get(url, headers=headers, auth=auth)
    response = r.json()

    try:
        entries_object = response['children']

        if not entries_object:
            raise

        entry_count = 1 if type(entries_object) == dict else len(entries_object)
        folders = []
        files = []

        for i in range(0, entry_count):
            object_type = entries_object['objectType'] if type(entry_count) == dict \
                else entries_object[i]['objectType']
            if object_type == "COLLECTION":
                folder_path = entries_object['pathOrName'] if type(entry_count) == dict \
                    else entries_object[i]['pathOrName']
                last_dash_index = folder_path.rfind('/')
                folder_name = folder_path[last_dash_index + 1:]
                folder_path = folder_path.replace("/", "%%")
                select_option = '<option value="%s" id="%s">%s</option>' % \
                                (folder_name, folder_path + "?" + object_type, folder_name)
                folders.append(select_option)
            else:
                file_name = entries_object['pathOrName'] if type(entry_count) == dict \
                    else entries_object[i]['pathOrName']
                file_path = (entries_object['parentPath'] + '/' + file_name) if type(entry_count) == dict \
                    else (entries_object[i]['parentPath'] + '/' + file_name)
                select_option = '<option value="%s" id="%s">%s</option>' % \
                                (file_name, file_path + "?" + object_type, file_name)
                files.append(select_option)

        if folders:
            if str(datetime.now().year) in folders[0]:
                folders.reverse()
            folders.insert(0, '<select title="Select a directory" class="folders"><option></option>')
            folders.append('</select>')
            folders = ''.join(folders)

        if files:
            if str(datetime.now().year) in files[0]:
                files.reverse()
            files.insert(0, '<select title="Select a file" class="files"><option></option>')
            files.append('</select>')
            files = ''.join(files)

        irods_data = {
            'folders': folders,
            'files': files
        }
    except Exception:
        if resource == "collection":
            folders = ''
            files = '<select title="No files to display" class="files"><option></option></select>'
            irods_data = {
                'folders': folders,
                'files': files
            }
            return irods_data
        else:
            irods_data = response
            return irods_data

    return irods_data
