def test_employer_job_posting_and_applications(client):
    # register employer
    rv = client.post(
        "/auth/register",
        json={"name": "Employer", "email": "emp@gmail.com", "password": "pw", "role": "employer"},
    )
    assert rv.status_code == 201

    # create a job
    rv = client.post(
        "/api/employer/jobs",
        json={
            "title": "Data Scientist",
            "description": "python pandas numpy",
            "location": "Remote",
            "salary": "100k",
            "skills": ["python", "pandas", "numpy"],
        },
    )
    assert rv.status_code == 200
    job = rv.get_json()
    job_id = job["id"]

    # register student in a separate client session to avoid role conflicts
    # Create a new client to ensure a clean session
    from app import create_app, db

    app2 = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })
    with app2.app_context():
        # Reuse same DB as app fixture? For simplicity, use same client with logout/login.
        pass

    # Instead, log out employer and register student within same client
    rv = client.post("/auth/logout")
    assert rv.status_code == 200
    rv = client.post(
        "/auth/register",
        json={"name": "Student", "email": "student@gmail.com", "password": "pw", "role": "student"},
    )
    assert rv.status_code == 201

    # student applies to the job (job_id belongs to existing DB)
    rv = client.post("/api/applications", json={"jobID": job_id})
    assert rv.status_code == 200
    app_info = rv.get_json()
    app_id = app_info["applicationID"]

    # switch back to employer
    rv = client.post("/auth/logout")
    assert rv.status_code == 200
    rv = client.post("/auth/login", json={"email": "emp@gmail.com", "password": "pw"})
    assert rv.status_code == 200

    # list applicants
    rv = client.get(f"/api/employer/jobs/{job_id}/applicants")
    assert rv.status_code == 200
    applicants = rv.get_json()
    assert len(applicants) == 1
    assert applicants[0]["status"] == "Submitted"

    # update application status
    rv = client.put(f"/api/employer/applications/{app_id}", json={"status": "Shortlisted"})
    assert rv.status_code == 200

    rv = client.get(f"/api/employer/jobs/{job_id}/applicants")
    assert rv.status_code == 200
    applicants = rv.get_json()
    assert applicants[0]["status"] == "Shortlisted"