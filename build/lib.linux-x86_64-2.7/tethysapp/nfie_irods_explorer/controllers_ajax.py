import sys
import tempfile
import shutil
import os
import traceback
import requests

sys.path.append('/usr/local/lib/python2.7/dist-packages')

from hs_restclient import HydroShare, HydroShareAuthBasic
from django.http import JsonResponse
from functions import irods_query


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
            hs = HydroShare(auth=auth, hostname="dev.hydroshare.org", use_https=True)

            # try to download a tiny file simply to test the user's credentials
            test_id = '49d01b5b0d0a41b6a5a31d8aace0a36e'
            hs.getResource(test_id, destination=None, unzip=False)

            #download the iRODS file to a temp directory
            temp_dir = tempfile.mkdtemp()
            filename = os.path.basename(download_path)
            file_path = os.path.join(temp_dir, filename)
            download = requests.get(download_path, stream=True)
            with open(file_path, 'wb') as fd:
                for chunk in download.iter_content(1024):
                    fd.write(chunk)

            #upload the temp file to HydroShare
            if os.path.exists(file_path):
                resource_id = hs.createResource(r_type, r_title, resource_file=file_path, keywords=r_keywords, abstract=r_abstract)
                shutil.rmtree(temp_dir)
            else:
                return JsonResponse({'error': 'An error occurred with the file upload.'})

            #remove the temp directory/file

    except Exception, err:
        if "401 Unauthorized" in str(err):
            return JsonResponse({'error': 'Username or password invalid. Please check them for errors.'})
        else:
            traceback.print_exc()
            if temp_dir:
                shutil.rmtree(temp_dir)
            return JsonResponse({'error': 'HydroShare rejected the upload for some reason.'})

    return JsonResponse({'success': 'File uploaded successfully!'})
