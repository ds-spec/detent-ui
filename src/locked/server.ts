/** What `@pro-server` resolves to without Detent Pro: every Pro route answers that it isn't here. */
const missing = () => Response.json({ error: 'This demo runs with the Detent Pro source checked out.' }, { status: 404 })

export const tandemChat: (req: Request) => Promise<Response> = async () => missing()
export const rapportChat: (req: Request) => Promise<Response> = async () => missing()
