// ============================================
// CLOUDFLARE WORKER - پنل مدیریت املاک اخلاصی
// ============================================

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // ==========================================
        // CORS HEADERS
        // ==========================================
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // ==========================================
        // API ROUTES
        // ==========================================

        // ----- PROPERTIES API -----
        if (path === '/api/properties') {
            if (request.method === 'GET') {
                const props = await env.KV.get('properties', 'json') || [];
                return new Response(JSON.stringify(props), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'POST') {
                const data = await request.json();
                const props = await env.KV.get('properties', 'json') || [];
                data.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                data.createdAt = new Date().toISOString();
                props.push(data);
                await env.KV.put('properties', JSON.stringify(props));
                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'DELETE') {
                const { id } = await request.json();
                let props = await env.KV.get('properties', 'json') || [];
                props = props.filter(p => p.id !== id);
                await env.KV.put('properties', JSON.stringify(props));
                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'PUT') {
                const data = await request.json();
                let props = await env.KV.get('properties', 'json') || [];
                const idx = props.findIndex(p => p.id === data.id);
                if (idx !== -1) {
                    props[idx] = { ...props[idx], ...data };
                    await env.KV.put('properties', JSON.stringify(props));
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                return new Response(JSON.stringify({ error: 'Not found' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // ----- ADVISORS API -----
        if (path === '/api/advisors') {
            if (request.method === 'GET') {
                const advs = await env.KV.get('advisors', 'json') || [];
                return new Response(JSON.stringify(advs), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'POST') {
                const data = await request.json();
                const advs = await env.KV.get('advisors', 'json') || [];
                data.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                advs.push(data);
                await env.KV.put('advisors', JSON.stringify(advs));
                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'DELETE') {
                const { id } = await request.json();
                let advs = await env.KV.get('advisors', 'json') || [];
                advs = advs.filter(a => a.id !== id);
                await env.KV.put('advisors', JSON.stringify(advs));
                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // ----- NOTES API -----
        if (path === '/api/notes') {
            if (request.method === 'GET') {
                const notes = await env.KV.get('notes', 'json') || [];
                return new Response(JSON.stringify(notes), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'POST') {
                const data = await request.json();
                const notes = await env.KV.get('notes', 'json') || [];
                data.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                notes.push(data);
                await env.KV.put('notes', JSON.stringify(notes));
                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'DELETE') {
                const { id } = await request.json();
                let notes = await env.KV.get('notes', 'json') || [];
                notes = notes.filter(n => n.id !== id);
                await env.KV.put('notes', JSON.stringify(notes));
                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // ----- CONTACTS API -----
        if (path === '/api/contacts') {
            if (request.method === 'GET') {
                const contacts = await env.KV.get('contacts', 'json') || [];
                return new Response(JSON.stringify(contacts), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'POST') {
                const data = await request.json();
                const contacts = await env.KV.get('contacts', 'json') || [];
                data.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                contacts.push(data);
                await env.KV.put('contacts', JSON.stringify(contacts));
                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'DELETE') {
                const { id } = await request.json();
                let contacts = await env.KV.get('contacts', 'json') || [];
                contacts = contacts.filter(c => c.id !== id);
                await env.KV.put('contacts', JSON.stringify(contacts));
                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // ----- REQUESTS API -----
        if (path === '/api/requests') {
            if (request.method === 'GET') {
                const requests = await env.KV.get('requests', 'json') || [];
                return new Response(JSON.stringify(requests), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'POST') {
                const data = await request.json();
                const requests = await env.KV.get('requests', 'json') || [];
                data.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                requests.push(data);
                await env.KV.put('requests', JSON.stringify(requests));
                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'PUT') {
                const { id, status } = await request.json();
                let requests = await env.KV.get('requests', 'json') || [];
                const idx = requests.findIndex(r => r.id === id);
                if (idx !== -1) {
                    requests[idx].status = status;
                    await env.KV.put('requests', JSON.stringify(requests));
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                return new Response(JSON.stringify({ error: 'Not found' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            if (request.method === 'DELETE') {
                const { id } = await request.json();
                let requests = await env.KV.get('requests', 'json') || [];
                requests = requests.filter(r => r.id !== id);
                await env.KV.put('requests', JSON.stringify(requests));
                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // ----- BACKUP API -----
        if (path === '/api/backup') {
            const data = {
                properties: await env.KV.get('properties', 'json') || [],
                advisors: await env.KV.get('advisors', 'json') || [],
                notes: await env.KV.get('notes', 'json') || [],
                contacts: await env.KV.get('contacts', 'json') || [],
                requests: await env.KV.get('requests', 'json') || [],
                date: new Date().toISOString(),
                version: '1.0'
            };
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ----- RESTORE API -----
        if (path === '/api/restore') {
            const data = await request.json();
            await env.KV.put('properties', JSON.stringify(data.properties || []));
            await env.KV.put('advisors', JSON.stringify(data.advisors || []));
            await env.KV.put('notes', JSON.stringify(data.notes || []));
            await env.KV.put('contacts', JSON.stringify(data.contacts || []));
            await env.KV.put('requests', JSON.stringify(data.requests || []));
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ----- UPLOAD API -----
        if (path === '/api/upload') {
            const formData = await request.formData();
            const file = formData.get('file');
            if (!file) {
                return new Response(JSON.stringify({ error: 'No file' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            const buffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            const key = `${Date.now()}-${file.name}`;
            await env.KV.put(`file_${key}`, base64);
            return new Response(JSON.stringify({
                url: `/api/file/${key}`,
                name: file.name,
                type: file.type
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ----- GET FILE -----
        if (path.startsWith('/api/file/')) {
            const key = path.replace('/api/file/', '');
            const base64 = await env.KV.get(`file_${key}`);
            if (!base64) {
                return new Response('File not found', { status: 404 });
            }
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return new Response(bytes, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${key}"`
                }
            });
        }

        // ==========================================
        // SERVE STATIC FILES (با استفاده از ASSETS)
        // ==========================================
        try {
            return await env.ASSETS.fetch(request);
        } catch (error) {
            return new Response('صفحه مورد نظر یافت نشد', {
                status: 404,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }
    }
};