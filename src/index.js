// ============================================
// CLOUDFLARE WORKER - املاک اخلاصی
// ============================================

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // ==========================================
        // API: UPLOAD IMAGE
        // ==========================================
        if (path === '/api/upload-image') {
            try {
                const formData = await request.formData();
                const file = formData.get('file');
                const folder = formData.get('folder') || 'properties';

                if (!file) {
                    return new Response(JSON.stringify({ error: 'فایلی انتخاب نشده است' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const fileSize = file.size;
                if (fileSize > 5 * 1024 * 1024) {
                    return new Response(JSON.stringify({ error: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const buffer = await file.arrayBuffer();
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);

                const fileName = file.name;
                const ext = fileName.split('.').pop();
                const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9\-]/g, '-').substring(0, 30);
                const timestamp = Date.now();
                const newFileName = `${timestamp}-${cleanName}.${ext}`;
                const filePath = `images/${folder}/${newFileName}`;

                const token = env.GITHUB_TOKEN;
                if (!token) {
                    return new Response(JSON.stringify({ error: 'توکن گیت‌هاب تنظیم نشده است' }), {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const repo = env.GITHUB_REPO || 'ekhlasi1/real-estate-panel';
                const branch = env.GITHUB_BRANCH || 'main';
                const githubUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

                let existingSha = null;
                try {
                    const checkResponse = await fetch(githubUrl, {
                        headers: {
                            'Authorization': `token ${token}`,
                            'User-Agent': 'Cloudflare-Worker'
                        }
                    });
                    if (checkResponse.ok) {
                        const existing = await checkResponse.json();
                        existingSha = existing.sha;
                    }
                } catch (e) {}

                const uploadResponse = await fetch(githubUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'Cloudflare-Worker'
                    },
                    body: JSON.stringify({
                        message: `آپلود تصویر: ${newFileName}`,
                        content: base64,
                        branch: branch,
                        ...(existingSha && { sha: existingSha })
                    })
                });

                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    return new Response(JSON.stringify({
                        error: 'خطا در آپلود به گیت‌هاب',
                        details: errorText
                    }), {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const cdnUrl = `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${filePath}`;

                return new Response(JSON.stringify({
                    success: true,
                    url: cdnUrl,
                    path: filePath,
                    fileName: newFileName
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // ==========================================
        // API: PROPERTIES
        // ==========================================
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
                if (!data.images) data.images = [];
                if (!data.videos) data.videos = [];
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
                return new Response(JSON.stringify({ error: 'ملک یافت نشد' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // ==========================================
        // API: ADVISORS
        // ==========================================
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

        // ==========================================
        // API: NOTES
        // ==========================================
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

        // ==========================================
        // API: CONTACTS
        // ==========================================
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

        // ==========================================
        // API: REQUESTS
        // ==========================================
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
                return new Response(JSON.stringify({ error: 'درخواست یافت نشد' }), {
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

        // ==========================================
        // API: BACKUP
        // ==========================================
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

        // ==========================================
        // API: RESTORE
        // ==========================================
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

        // ==========================================
        // SERVE STATIC FILES
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