// Test script to verify API route
async function testRegisterAPI() {
  console.log("Testing registration API...\n");

  const testData = {
    name: "Test User",
    email: "test@example.com",
    password: "TestPass123",
  };

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("Response:", JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log("HTML Response (first 500 chars):");
      console.log(text.substring(0, 500));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testRegisterAPI();
