import sys
import tempfile
import shutil
import os
import traceback
import requests

sys.path.append('/usr/local/lib/python2.7/dist-packages')

from datetime import datetime
from requests.auth import HTTPBasicAuth
from hs_restclient import HydroShare, HydroShareAuthBasic
from django.http import JsonResponse
from django.shortcuts import render


def home(request):

    irods_data = irods_query("/nfiehydroZone/home/public?COLLECTION")

    context = {
        'irods_data': irods_data
    }

    return render(request, 'nfie_irods_explorer/home.html', context)


def get_dropdown_contents(request):
    if request.method == 'GET':
        selection_path = request.GET['selection_path']
        irods_data = irods_query(selection_path)

        return JsonResponse({
                                'success': "Response successfully returned!",
                                'irods_data': irods_data
        })


def upload_to_hydroshare(request):
    try:
        if request.method == 'GET':
            get_data = request.GET
            download_path = str(get_data['download_path'])
            hs_username = str(get_data['hs_username'])
            hs_password = str(get_data['hs_password'])
            r_title = str(get_data['r_title'])
            r_type = str(get_data['r_type'])
            r_abstract = str(get_data['r_abstract'])
            r_keywords_raw = str(get_data['r_keywords'])
            r_keywords = r_keywords_raw.split(',')

            #startup a Hydroshare instance with user's credentials
            auth = HydroShareAuthBasic(username=hs_username, password=hs_password)
            hs = HydroShare(auth=auth, hostname="alpha.hydroshare.org", use_https=True)

            # try to download a tiny file simply to test the user's credentials
            # test_id = '49d01b5b0d0a41b6a5a31d8aace0a36e'
            # hs.getResource(test_id, destination=None, unzip=False)

            #download the iRODS file to a temp directory
            temp_dir = tempfile.mkdtemp()
            filename = os.path.basename(download_path)
            download_file_path = os.path.join(temp_dir, filename)
            download = requests.get(download_path, stream=True)
            with open(download_file_path, 'wb') as fd:
                for chunk in download.iter_content(1024):
                    fd.write(chunk)

            #upload the temp file to HydroShare
            if os.path.exists(download_file_path):
                resource_id = hs.createResource(r_type, r_title, resource_file=download_file_path, keywords=r_keywords, abstract=r_abstract)
            else:
                if temp_dir:
                    # remove the temp directory/file
                    shutil.rmtree(temp_dir)
                return JsonResponse({'error': 'An error occurred with the file upload.'})

    except Exception, err:
        if temp_dir:
            # remove the temp directory/file
            shutil.rmtree(temp_dir)
        if "401 Unauthorized" in str(err):
            return JsonResponse({'error': 'Username or password invalid.'})
        elif "400 Bad Request" in str(err):
            return JsonResponse({'error': 'File uploaded successfully despite 400 Bad Request Error.'})
        else:
            traceback.print_exc()
            return JsonResponse({'error': 'HydroShare rejected the upload for some reason.'})

    # remove the temp directory/file
    shutil.rmtree(temp_dir)
    return JsonResponse({'success': 'File uploaded successfully!',
                         'newResource': resource_id})


def irods_query(selection_path):

    resource = 'collection' if '?COLLECTION' in selection_path else 'dataObject'

    object_type_index = selection_path.rfind('?')
    selection_path = selection_path[0:object_type_index]
    selection_path = selection_path.replace("%%", "/")

    headers = {'Accept': 'application/json'}
    auth = HTTPBasicAuth('username', 'password')
    url = 'http://nfie.hydroshare.org:8080/irods-rest/rest/' + resource + selection_path + '?listing=true'
    print url

    r = requests.get(url, headers=headers, auth=auth)
    print r
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
