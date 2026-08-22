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

        // SHORT LINK: /c -> commission.html (URL stays /c, no redirect)
        if (path === '/c' || path === '/c/') {
            const rewritten = new URL(request.url);
            rewritten.pathname = '/commission.html';
            return env.ASSETS.fetch(new Request(rewritten.toString(), request));
        }

        // ADVISOR CARD PAGES: /1 -> advisor #1, /2 -> advisor #2, ... (URL stays /N, no redirect)
        const cardMatch = path.match(/^\/(\d+)\/?$/);
        if (cardMatch) {
            const rewritten = new URL(request.url);
            rewritten.pathname = '/card.html';
            rewritten.search = `?n=${cardMatch[1]}`;
            return env.ASSETS.fetch(new Request(rewritten.toString(), request));
        }

        // LOGIN — validates admin (username "admin") or advisor (username = phone number)
        // credentials on the server, so plaintext passwords never have to be sent to
        // every visitor of the login page.
        if (path === '/api/login') {
            if (request.method !== 'POST') {
                return new Response(JSON.stringify({ error: 'روش نامعتبر' }), {
                    status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            const { username, password } = await request.json();
            const uname = (username || '').trim();
            const pass = (password || '').trim();
            const normalize = (v) => (v || '').replace(/\D/g, '');

            if (uname === 'admin') {
                const adminSettings = await env.KV.get('admin_settings', 'json') || {};
                const adminPassword = adminSettings.password || 'admin123';
                if (pass === adminPassword) {
                    return new Response(JSON.stringify({ success: true, role: 'admin' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                return new Response(JSON.stringify({ success: false, error: 'نام کاربری یا رمز عبور اشتباه است' }), {
                    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const advisors = await env.KV.get('advisors', 'json') || [];
            const advisor = advisors.find(a => normalize(a.phone) === normalize(uname) && normalize(uname).length > 0);
            if (advisor && pass === advisor.password) {
                return new Response(JSON.stringify({
                    success: true,
                    role: 'advisor',
                    advisorId: advisor.id,
                    advisorName: advisor.name
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ success: false, error: 'نام کاربری یا رمز عبور اشتباه است' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // CHANGE PASSWORD — verifies the current password on the server before writing the new one
        if (path === '/api/change-password') {
            if (request.method !== 'POST') {
                return new Response(JSON.stringify({ error: 'روش نامعتبر' }), {
                    status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            const { role, advisorId, currentPassword, newPassword } = await request.json();
            const current = (currentPassword || '').trim();
            const next = (newPassword || '').trim();

            if (next.length < 6) {
                return new Response(JSON.stringify({ success: false, error: 'رمز جدید باید حداقل ۶ کاراکتر باشد' }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (role === 'admin') {
                const adminSettings = await env.KV.get('admin_settings', 'json') || {};
                const adminPassword = adminSettings.password || 'admin123';
                if (current !== adminPassword) {
                    return new Response(JSON.stringify({ success: false, error: 'رمز فعلی اشتباه است' }), {
                        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                adminSettings.password = next;
                await env.KV.put('admin_settings', JSON.stringify(adminSettings));
                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (role === 'advisor' && advisorId) {
                let advisors = await env.KV.get('advisors', 'json') || [];
                const idx = advisors.findIndex(a => a.id === advisorId);
                if (idx === -1) {
                    return new Response(JSON.stringify({ success: false, error: 'مشاور یافت نشد' }), {
                        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                if (current !== advisors[idx].password) {
                    return new Response(JSON.stringify({ success: false, error: 'رمز فعلی اشتباه است' }), {
                        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                advisors[idx].password = next;
                await env.KV.put('advisors', JSON.stringify(advisors));
                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({ success: false, error: 'درخواست نامعتبر' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // PUBLIC ADVISOR CARD DATA — only the fields the public card page needs.
        // (Deliberately excludes the advisor's login password, unlike /api/advisors.)
        if (path === '/api/advisors/public') {
            const advs = await env.KV.get('advisors', 'json') || [];
            const safe = advs.map((a, idx) => ({
                cardNumber: a.cardNumber || (idx + 1),
                name: a.name || '',
                englishName: a.englishName || '',
                phone: a.phone || '',
                specialty: a.specialty || '',
                experience: a.experience || '',
                image: a.image || ''
            }));
            return new Response(JSON.stringify(safe), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // UPLOAD IMAGE
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

                if (file.size > 5 * 1024 * 1024) {
                    return new Response(JSON.stringify({ error: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const buffer = await file.arrayBuffer();
                const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

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

        // PROPERTIES
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

        // ADVISORS
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
            if (request.method === 'PUT') {
                const data = await request.json();
                let advs = await env.KV.get('advisors', 'json') || [];
                const idx = advs.findIndex(a => a.id === data.id);
                if (idx !== -1) {
                    advs[idx] = { ...advs[idx], ...data };
                    await env.KV.put('advisors', JSON.stringify(advs));
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                return new Response(JSON.stringify({ error: 'مشاور یافت نشد' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // NOTES
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

        // CONTACTS
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

        // REQUESTS
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

        // BACKUP
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

        // RESTORE
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

        // SERVE STATIC FILES
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