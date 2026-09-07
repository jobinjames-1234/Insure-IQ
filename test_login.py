import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        res = await client.post("http://localhost:18000/api/v1/auth/login", json={
            "email": "super@abc.com",
            "password": "password123"
        })
        print(res.status_code, res.text)
        if res.status_code == 200:
            token = res.json()["access_token"]
            res2 = await client.get("http://localhost:18000/api/v1/auth/me", headers={
                "Authorization": f"Bearer {token}"
            })
            print(res2.status_code, res2.text)

asyncio.run(main())
