from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CustomsDocument
from .serializers import CustomsDocumentSerializer
class CustomsViewSet(viewsets.ModelViewSet):
    queryset = CustomsDocument.objects.select_related('cargo').all()
    serializer_class = CustomsDocumentSerializer
    filterset_fields = ['cargo', 'document_type', 'is_verified']
@api_view(['POST'])
def verify(request):
    ids = request.data.get('document_ids')
    documents = CustomsDocument.objects.filter(id__in=ids) if ids else CustomsDocument.objects.filter(is_verified=False)
    count = documents.update(is_verified=True)
    return Response({'success': True, 'verified_count': count, 'message': 'Документы проверены в demo-режиме'})
