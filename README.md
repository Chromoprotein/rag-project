This is a simple GenAI creative writing assistant. It uses RAG for keeping important story points (characters, plot, locations) consistent and avoiding making them up/hallucinating. Style instructions can also be set. So, it's not necessary to explain too many things in every prompt.

How it works:
- Based on the user's prompt, the model generates a few queries.
- The queries are used to search the story database with embeddings and retrieve context.
- The context is used together with the user's prompt to generate writing.
- When the user sends the next prompt, the model determines if context should be retrieved again or if the previous context is sufficient. It shouldn't be lazy about re-retrieving now.

Stack: Python | Flask | React | Tailwind CSS | Typescript | OpenAI API | SentenceTransformers