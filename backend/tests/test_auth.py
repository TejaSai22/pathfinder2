def test_register_login_me(client):
    # register
    rv = client.post(
        "/auth/register",
        json={"name": "Alice", "email": "alice@gmail.com", "password": "secret", "role": "student"},
    )
    assert rv.status_code == 201
    data = rv.get_json()
    assert data["email"] == "alice@gmail.com"
    assert data["role"] == "student"

    # me
    rv = client.get("/auth/me")
    assert rv.status_code == 200
    me = rv.get_json()
    assert me["email"] == "alice@gmail.com"

    # logout and login
    rv = client.post("/auth/logout")
    assert rv.status_code == 200
    rv = client.post("/auth/login", json={"email": "alice@gmail.com", "password": "secret"})
    assert rv.status_code == 200
    me = rv.get_json()
    assert me["name"] == "Alice"