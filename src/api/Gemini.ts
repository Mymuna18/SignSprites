const API_URL = "http://localhost:3001";

export async function getASLTip(letter: string, attempts: number): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/asl-tip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter, attempts }),
    });
    const data = await response.json();
    return data.tip || "Keep trying! You've got this!";
  } catch (error) {
    console.error("Error fetching ASL tip:", error);
    return "Keep trying! You've got this! ✨";
  }
}

export async function getEncouragement(letter: string, totalCollected: number): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/encouragement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter, totalCollected }),
    });
    const data = await response.json();
    return data.message || "Amazing work! Keep going!";
  } catch (error) {
    console.error("Error fetching encouragement:", error);
    return "Amazing work! Keep going! ✨";
  }
}