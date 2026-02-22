const API_URL = "http://localhost:3001";

export async function getASLTip(
  targetLetter: string,
  attempts: number,
  detectedLetter?: string
): Promise<string> {
  const res = await fetch("http://localhost:3001/api/asl-tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ letter: targetLetter, attempts, detectedLetter }),
  });

  if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }
    
  const data = await res.json();
  return data.tip;
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