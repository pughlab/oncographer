import { createMachine } from 'xstate';

export const formStateMachine = createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QDMD2AnAtgOgDaoEMIBLAOygGIAZAeQEEARAUQYG0AGAXUVAAdVYxAC7FUpHiAAeiAIwyAHACZs8gCwBmAOwBORaoBs+9apkAaEAE9Ei9u2yKArLfXbN6h5o-yAvt-NosbDBMXiELCg5uJBB+QRExCWkEGUU5bC8bB1V5GU92TXMrBBzsVW1y7XV9VQcZQyVffwwcAGNcMAJSCgBhAAk6ADkAcSZIiVjhUXFopN1NeydbGW0leX1tQutbbDzbV312XX1FHz8QAJxMVBJkYkgeqiY6ACUx6In46dAkuSUVDR0ekMxjMlmsDnkO0WGnYik8KU0jXOzWwVxudwgPX6w1GXHGAkmCRmiByqnsbg0qXYWR06k2CEUxx2eT07C0RiySIu2AAbgRcMQIAQROQKABlACq3W6TDFYrefAJn0Ssj+1IM8jZNVyWvp6hK7EMmj0WTWtk8XJRfIFQpFlAAYnQAJJUCXPXFRRVxKYq5JqrL6TXGWqaXVghCBmQqCqaGqqQ5lRSWwLWwVYwYjBUxJU+4kR+SQ6o2JTqZYOFwFcNaByldikg61GrqJNnbmpzGSgBCAFknQAVLMfXPfRDxskVcqaY0ORwQytFJxRnKGbTHZbVQzJnBkdvpnGDnNEkcIOYLWzsZardb0pzKfSLRTaBwz1zlfRb7CwACuACNMMI7XFKUZTlA9vSPKREEMMldgveQp2fXQb30KMZDKFZNALPR4PfVsUW-P8ALIB1nVdd0wMJL5IIjaooXPBQEIcJDwzKGt41sbIMI8Wp1A-Aj-yEIR7go5U8xkC99B2TVA3kJj1H1NlkLvdCjByLxcl8M5SGuOAJAufFwKopIAFp9HpYyawnN9S1SIx1g-fAiGIgzKN9cTPGwdR2FUTxb20RMHHpGw7Fg-ZDkZE4P2CUIii9VyxNLSToMOTx5MqeD6QUbRPPPfUPA0GQmNOJpAjaDoqKHCCkiUbLYWMLQLzQzJ6TWbA63k2oVjWBQfI-NFiFuSAXNE49xNo-YHH0TQ0LredwWyxwOK8uFajhD922FZz3kPIzR0UIKmQQ2F43ZdwNHW-lBWG4dqMSnY2RSdxCrUJ89RKSappNbIDnyBwPx3S6IGuqqSUNbBkqMYxDDhOaECcdRsEK2wmJnTC5GfPjfwEu1gd2uHmx2RlJpOeRm0mjZw1vTy6mNFD-J8ho8MCfiAKG7bDN9F77sDPY6nE0EFxQxH0PgrDsgtTSgA */
    id: "form",
    initial: "loading",
    states: {
        loading: {
            invoke: {
                src: 'initializeForm',
                onDone: {
                    target: 'empty'
                },
                onError: {
                    target: 'error'
                }
            }
        },
        error: {
            type: 'final'
        },
        empty: {
            entry: 'executeClearForm',
            always: { target: 'clean' }
        },
        clean: {
            on: {
                CHANGE: 'modified'
            }
        },
        modified: {
            always: 'validating'
        },
        validating: {
            on: {
                SUCCESS: 'valid',
                FAILURE: 'invalid'
            }
        },
        valid: {
            entry: 'saveDraft',
            on: {
                CLEAR: 'empty',
                CHANGE: 'modified',
                SUBMIT: 'submitting'
            }
        },
        invalid: {
            on: {
                CLEAR: 'empty',
                CHANGE: "modified"
            }
        },
        submitting: {
            invoke: {
                src: 'executeSubmitForm',
                onDone: { target: 'submitted' },
                onError: { target: 'invalid' }
            }
        },
        submitted: {
            always: 'empty'
        }
    }
})