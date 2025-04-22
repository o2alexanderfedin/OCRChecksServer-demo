import type { Io } from "functionalscript/io/module.f.js"

type IoE = Io & {
    readonly fetch: (url: string, options: RequestInit) => Promise<Response>
    readonly atob: (data: string) => string
}

interface MistralResponse {
    choices: Array<{
        message: {
            content: string
        }
    }>
}

interface CheckData {
    amount: string
    date: string
    payee: string
    memo: string
}

export const processCheckImage = async (
    io: IoE,
    imageData: ArrayBuffer,
    apiKey: string
): Promise<CheckData> => {
    // Convert image data to base64
    const base64Image = io.atob(
        new Uint8Array(imageData).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
        )
    )

    // Prepare the prompt
    const prompt = `Analyze this check image and extract the following information in JSON format:
    - amount: The check amount in dollars and cents
    - date: The check date in MM/DD/YYYY format
    - payee: The name of the person or company the check is made out to
    - memo: Any memo text written on the check

    Return ONLY the JSON object with these fields.`

    // Call Mistral AI API
    const [status, result] = await io.asyncTryCatch(() =>
        io.fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-large',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ]
            })
        })
    )

    if (status === 'error') {
        throw new Error(`Mistral API error: ${result}`)
    }

    const response = await result.json() as MistralResponse
    const content = response.choices[0].message.content

    try {
        return JSON.parse(content) as CheckData
    } catch (_) {
        throw new Error(`Failed to parse Mistral response: ${content}`)
    }
} 