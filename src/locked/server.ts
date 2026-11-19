const missing = () => Response.json({ error: 'This demo runs with the Detent Pro source checked out.' }, { status: 404 })

export const detentChat: (req: Request) => Promise<Response> = async () => missing()

export const planItem: (name: string) => object | null = () => null
