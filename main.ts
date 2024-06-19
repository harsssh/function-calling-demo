import OpenAI from 'npm:openai@4.51.0'
import { blue } from 'https://deno.land/std@0.224.0/fmt/colors.ts'

// load OPENAI_API_KEY
const client = new OpenAI()

const available_functions: Record<string, (...args: any[]) => any> = {
    addTodoItem: ({ itemName }) => {
        console.log(blue(`Adding todo item: ${itemName}`))
        return `Added todo item: ${itemName}`
    },
}

async function generateChatCompletion(prompt: string) {
    const chatParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        tools: [{
            type: 'function',
            function: {
                name: 'addTodoItem',
                description: 'Add a new todo item to the list of todos.',
                parameters: {
                    type: 'object',
                    properties: {
                        itemName: {
                            type: 'string',
                            description: 'Name of the todo item to be added.',
                        },
                    },
                    required: ['itemName'],
                },
            },
        }],
    }

    const response = await client.chat.completions.create(chatParams)
    const responseMessage = response.choices[0].message
    console.log('Response:')
    console.log(responseMessage)

    if (responseMessage.tool_calls) {
        chatParams.messages.push(responseMessage)

        for (const toolCall of responseMessage.tool_calls) {
            const functionToCall = available_functions[toolCall.function.name]
            if (functionToCall) {
                const functionArguments = JSON.parse(
                    toolCall.function.arguments,
                )
                const functionResponse = functionToCall(functionArguments)

                chatParams.messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: functionResponse,
                })
            }
        }

        const responseWithToolCalls = await client.chat.completions.create(
            chatParams,
        )
        console.log('Response with tool calls:')
        console.log(responseWithToolCalls.choices[0].message)
    }
}

async function main() {
    const input = prompt('Please enter a message:')
    if (!input) {
        console.error('No input provided')
        return
    }
    await generateChatCompletion(input)
}

await main()
