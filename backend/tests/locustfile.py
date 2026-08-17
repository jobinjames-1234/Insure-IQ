from locust import HttpUser, task, between

class InsureIQUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        # We assume the user logs in and gets a token
        # For simplicity, we just use a mocked token or no auth for public endpoints
        self.headers = {"X-Tenant-ID": "00000000-0000-0000-0000-000000000000"}

    @task
    def load_home(self):
        # Simulate accessing public health endpoint
        self.client.get("/console/health")

    @task(3)
    def load_tenant_branding(self):
        # Simulate accessing tenant branding which is fetched often
        self.client.get("/tenants/branding", headers=self.headers)
