from django.conf import settings
class Neo4jClient:
    def __init__(self):
        self.driver = None
        if settings.NEO4J_URI:
            from neo4j import GraphDatabase
            self.driver = GraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))
    def close(self):
        if self.driver: self.driver.close()
    def get_routes(self, start, destination):
        if not self.driver: return []
        query = 'MATCH path=(a:Port {code: $start})-[*1..6]-(b:Port {code: $destination}) RETURN path LIMIT 10'
        with self.driver.session() as session: return [record['path'] for record in session.run(query, start=start, destination=destination)]
