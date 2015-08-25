from django.shortcuts import render
from functions import irods_query


def home(request):

    irods_data = irods_query("/nfiehydroZone/home/public?COLLECTION")

    context = {
        'irods_data': irods_data
    }

    return render(request, 'nfie_irods_explorer/home.html', context)
