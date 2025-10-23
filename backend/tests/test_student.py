def test_student_profile_and_recommendations(client):
    # register as student
    rv = client.post(
        "/auth/register",
        json={"name": "Student", "email": "stu@gmail.com", "password": "pw", "role": "student"},
    )
    assert rv.status_code == 201

    # get initial profile
    rv = client.get("/api/student/profile")
    assert rv.status_code == 200
    prof = rv.get_json()
    assert prof["skills"] == []

    # update profile
    rv = client.put(
        "/api/student/profile",
        json={
            "educationHistory": "BS CS",
            "interests": "ml data",
            "skills": ["python", "pandas", "numpy"],
        },
    )
    assert rv.status_code == 200

    # career recommendations
    rv = client.get("/api/student/recommendations/careers")
    assert rv.status_code == 200
    careers = rv.get_json()
    assert isinstance(careers, list) and len(careers) > 0

    # job recommendations empty until jobs exist
    rv = client.get("/api/student/recommendations/jobs")
    assert rv.status_code == 200
    assert rv.get_json() == []