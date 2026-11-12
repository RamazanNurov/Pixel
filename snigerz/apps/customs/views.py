from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import CustomsDocument
from .serializers import CustomsDocumentSerializer
class CustomsViewSet(viewsets.ModelViewSet):
    queryset = CustomsDocument.objects.select_related('cargo').all()
    serializer_class = CustomsDocumentSerializer
    filterset_fields = ['cargo', 'document_type', 'is_verified']

    def get_queryset(self):
        return super().get_queryset().filter(Q(cargo__owner=self.request.user) | Q(cargo__owner__isnull=True))
@api_view(['POST'])
def verify(request):
    ids = request.data.get('document_ids')
    visible = CustomsDocument.objects.filter(Q(cargo__owner=request.user) | Q(cargo__owner__isnull=True))
    documents = visible.filter(id__in=ids) if ids else visible.filter(is_verified=False)
    count = documents.update(is_verified=True)
    return Response({'success': True, 'verified_count': count, 'message': 'Документы проверены в demo-режиме'})
