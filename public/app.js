// Initialize Supabase client
const SUPABASE_URL = 'https://igbwlzcxhenclxkneocf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnYndsemN4aGVuY2x4a25lb2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDk3MzAsImV4cCI6MjA3NDEyNTczMH0.3YwcjVJIhf82_Yxede2cVfOfvdSFfAZQ2WxG1smd29Y';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth module
const auth = {
    async login(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) throw error;
        return data;
    },

    async register(email, password) {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });
        if (error) throw error;
        return data;
    },

    async logout() {
        await supabaseClient.auth.signOut();
        window.location.href = '/';
    },

    async checkSession() {
        const { data } = await supabaseClient.auth.getSession();
        return data?.session !== null;
    },

    async getUser() {
        const { data } = await supabaseClient.auth.getUser();
        return data?.user;
    },

    async getToken() {
        const { data } = await supabaseClient.auth.getSession();
        return data?.session?.access_token;
    }
};

// Projects module
const projects = {
    async list() {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async create(name, systemPrompt) {
        const { data, error } = await supabaseClient
            .from('projects')
            .insert([{
                name: name,
                system_prompt: systemPrompt,
                user_id: (await supabaseClient.auth.getUser()).data.user.id
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(projectId) {
        const { error } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', projectId);
        if (error) throw error;
    },

    async getById(projectId) {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        if (error) throw error;
        return data;
    }
};

// Chat module
const chat = {
    async createConversation(projectId) {
        const { data, error } = await supabaseClient
            .from('conversations')
            .insert([{
                project_id: projectId,
                title: 'New Conversation'
            }])
            .select()
            .single();
        if (error) throw error;
        return data.id;
    },

    async loadConversations(projectId) {
        const { data, error } = await supabaseClient
            .from('conversations')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async loadMessages(conversationId) {
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async saveMessage(conversationId, role, content) {
        const { error } = await supabaseClient
            .from('messages')
            .insert([{
                conversation_id: conversationId,
                role: role,
                content: content
            }]);
        if (error) throw error;
    },

    async streamResponse(messages, projectId, onChunk) {
        const token = await auth.getToken();
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                messages: messages,
                projectId: projectId
            })
        });

        if (!response.ok) {
            throw new Error('Chat request failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.content) {
                            onChunk(parsed.content);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }
    }
};

// Files module
const files = {
    async upload(projectId, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64 = reader.result.split(',')[1];
                    const token = await auth.getToken();

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            filename: file.name,
                            content: base64,
                            projectId: projectId
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Upload failed');
                    }

                    const result = await response.json();

                    // Save file reference to Supabase
                    const { error } = await supabaseClient
                        .from('files')
                        .insert([{
                            project_id: projectId,
                            filename: file.name,
                            openai_file_id: result.fileId
                        }]);

                    if (error) throw error;
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    },

    async list(projectId) {
        const { data, error } = await supabaseClient
            .from('files')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }
};