import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # Test Tenant Admin login via Institution portal
        print("Testing Tenant Admin (admin@abc.com on /login/institution)...")
        res = await client.post("http://localhost:18000/api/v1/auth/login/institution", json={
            "email": "admin@abc.com",
            "password": "password123"
        })
        print(res.status_code, res.text)
        if res.status_code == 200:
            token = res.json()["access_token"]
            res2 = await client.get("http://localhost:18000/api/v1/auth/me", headers={
                "Authorization": f"Bearer {token}"
            })
            print(res2.status_code, res2.text)

        # Test Superadmin login via Superadmin portal
        print("\nTesting Superadmin (super@platform.com on /login/superadmin)...")
        res_sa = await client.post("http://localhost:18000/api/v1/auth/login/superadmin", json={
            "email": "super@platform.com",
            "password": "password123"
        })
        print(res_sa.status_code, res_sa.text)

        # Test failure: Tenant admin trying to log into Superadmin portal
        print("\nTesting Failure: admin@abc.com on /login/superadmin...")
        res_fail = await client.post("http://localhost:18000/api/v1/auth/login/superadmin", json={
            "email": "admin@abc.com",
            "password": "password123"
        })
        print(res_fail.status_code, res_fail.text)
        
        # Test failure: Customer trying to log into Institution portal
        print("\nTesting Failure: customer1@abc.com on /login/institution...")
        res_cust_fail = await client.post("http://localhost:18000/api/v1/auth/login/institution", json={
            "email": "customer1@abc.com",
            "password": "password123"
        })
        print(res_cust_fail.status_code, res_cust_fail.text)
        
        # Test Customer login via Customer portal
        print("\nTesting Customer (customer1@abc.com on /login/customer)...")
        res_cust = await client.post("http://localhost:18000/api/v1/auth/login/customer", json={
            "email": "customer1@abc.com",
            "password": "password123"
        })
        print(res_cust.status_code, res_cust.text)

asyncio.run(main())
