const baseUrl = import.meta.env.VITE_API_URL;

export const fetchGameStatus = async () => {
  const res = await fetch(`${baseUrl}/status`);
  return res.json();
};

export const sendMove = async (moveData: any) => {
  const res = await fetch(`${baseUrl}/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(moveData),
  });
  return res.json();
};
