import { emoji } from "#config";

export default {
    metadata: {
        name: "Bahasa Indonesia",
        code: "id",
    },

    common: {
        onlyInGuild: "Perintah ini hanya bisa digunakan di dalam server.",
        deferReply: "Mengirim permintaan...",
    },

    errors: {
        run: "Terjadi kesalahan!",
        options: "Opsi yang diberikan tidak valid.",
        permissions: (permissions: string) => `Kamu butuh izin ${permissions} untuk memakai perintah ini.`,
        botPermissions: (permissions: string) => `Aku butuh izin ${permissions} untuk menjalankan perintah ini.`,
    },

    middleware: {
        cooldown: (time?: string) => `Perintah ini sedang cooldown. Coba lagi ${time}.`,
    },

    help: {
        description: "Menampilkan daftar perintah dan bantuan penggunaan.",
        options: {
            command: "Masukkan nama perintah.",
        },
        list: {
            title: "Daftar perintah",
            description: (helpSlash?: string) =>
                `Ini adalah daftar perintah. Gunakan ${helpSlash} untuk info perintah yang lebih spesifik.`,
        },
        specific: {
            searching: (cmdName?: string) => `*Mencari perintah dengan nama \`${cmdName}\`...*`,
            notFound: (cmdName?: string) => `Perintah dengan nama \`${cmdName}\` tidak ditemukan.`,
            aliases: (list?: string) => `alias: ${list}`,
            category: (name?: string) => `kategori: \`${name}\``,
            cooldown: (cd?: number) => `cooldown: \`${cd} detik\``,
        },
    },

    avatar: {
        description: "Menampilkan avatar global dan server pengguna.",
        options: {
            user: "ID, nama, atau mention pengguna untuk mengambil avatar.",
        },
        title: (name?: string) => `Avatar ${name ?? "Pengguna"}`,
    },

    chat: {
        description: "Mengobrol dengan asisten AI yang ramah.",
        options: {
            message: "Mau ngobrol tentang apa. Kirim `reset` untuk menghapus percakapan.",
        },
        empty: "`❌` Berikan pesan untuk mengobrol dengan AI.",
        reset: "`🔄` Riwayat percakapan sudah dihapus.",
        unavailable: "`❌` AI sedang tidak tersedia saat ini. Coba lagi sebentar lagi.",
        footer: "Didukung oleh Pollinations.ai",
    },

    prefix: {
        description: "Atur prefix perintah tambahan atau reset ke bawaan untuk server ini.",
        options: {
            prefixs: "Tambah prefix tambahan atau reset prefix perintah untuk server ini.",
        },
        current: (list?: string) =>
            `\`ℹ️\` Prefix saat ini: ${list}\n\nPenggunaan:\n- \`prefix <prefix...>\` — tambah prefix tambahan di atas bawaan\n- \`prefix reset\` — reset ke prefix bawaan saja`,
        reset: (list?: string) => `✅ Prefix telah direset ke: ${list}`,
        updated: (list?: string) => `✅ Prefix telah diperbarui menjadi: ${list}`,
        invalid: "`❌` Berikan 1-10 prefix unik, masing-masing maksimal 5 karakter.",
    },

    language: {
        description: "Ubah bahasa bot untuk server ini.",
        options: {
            locale: "Kode bahasa yang akan diatur.",
        },
        current: (current?: string, list?: string) =>
            `\`ℹ️\` Bahasa saat ini: ${current}\nTersedia:\n${list}\n\nPenggunaan: \`language <locale>\` — atur bahasa bot untuk server ini.`,
        notSupported: (input?: string, list?: string) => `\`❌\` Bahasa \`${input}\` tidak didukung.\nTersedia:\n${list}`,
        updated: (locale?: string, name?: string) => `✅ Bahasa telah diatur ke \`${locale}\`${name ? ` (${name})` : ""}.`,
    },

    ping: {
        title: "Latensi",
        description: "Menampilkan latensi klien, runtime, dan database.",
        client: {
            title: "Klien",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        database: {
            title: "Database",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        runtime: {
            title: "Runtime",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
    },

    stats: {
        description: "Menampilkan statistik bot.",
        title: "Informasi Statistik",
        fields: {
            guilds: "Total Server",
            users: "Total Pengguna",
            channels: "Total Channel",
            roles: "Total Role",
            emojis: "Total Emoji",
            members: "Total Anggota",
            messages: "Total Pesan",
            latency: "Latensi",
            shards: "Shard",
            os: "OS",
            release: "Rilis",
            arch: "Arsitektur",
            cpu: "CPU",
            memory: "Memori ( RSS )",
            uptime: "Uptime",
        },
    },

    music: {
        play: {
            description: "Putar lagu atau playlist dari pencarian atau URL.",
            options: {
                query: "Nama lagu, URL, atau kata pencarian.",
            },
            added: (title: string, position: number) => `${emoji.music.add} **${title}** ditambahkan ke antrean (${position}).`,
            playlistAdded: (name: string, count: number) => `${emoji.music.add} **${count}** lagu dari **${name}** ditambahkan ke antrean.`,
            ended: `${emoji.music.ended} Antrean selesai, keluar dari voice channel.`,
        },
        skip: {
            description: "Lewati lagu yang sedang diputar.",
            options: {
                amount: "Berapa lagu yang dilewati.",
            },
            skipped: (title: string) => `${emoji.music.skip} **${title}** dilewati.`,
            noNext: `${emoji.error} Tidak ada lagu berikutnya untuk dilewati.`,
        },
        stop: {
            description: "Hentikan player dan bersihkan antrean.",
            stopped: `${emoji.music.ended} Player dihentikan dan antrean dibersihkan.`,
        },
        pause: {
            description: "Jeda lagu yang sedang diputar.",
            paused: `${emoji.music.pause} Player dijeda.`,
            already: `${emoji.error} Player sudah dijeda.`,
        },
        resume: {
            description: "Lanjutkan lagu yang sedang dijeda.",
            resumed: `${emoji.music.resume} Player dilanjutkan.`,
            already: `${emoji.error} Player tidak sedang dijeda.`,
        },
        nowplaying: {
            description: "Tampilkan lagu yang sedang diputar.",
            title: "Sedang Diputar",
            fields: {
                author: "Artis",
                duration: "Durasi",
                position: "Posisi",
            },
        },
        queue: {
            description: "Tampilkan antrean saat ini.",
            options: {
                page: "Halaman antrean.",
            },
            title: "Antrean",
            nowPlaying: "Sedang Diputar",
            upcoming: "Berikutnya",
            empty: `${emoji.error} Antrean kosong.`,
            footer: (length: number, page: number, pages: number) => `${length} lagu • Halaman ${page}/${pages}`,
        },
        volume: {
            description: "Atur volume player.",
            options: {
                volume: "Persentase volume (0-200).",
            },
            set: (volume: number) => `${emoji.music.volume} Volume diatur ke **${volume}%**.`,
        },
        loop: {
            description: "Putar mode loop antrean secara bergantian.",
            options: {
                mode: "Mode loop.",
            },
            modes: {
                none: "mati",
                track: "lagu",
                queue: "antrean",
            },
            set: (mode: string) => `${emoji.music.loop} Mode loop diatur ke **${mode}**.`,
        },
        shuffle: {
            description: "Acak lagu-lagu di antrean.",
            shuffled: (count: number) => `${emoji.music.shuffle} **${count}** lagu di antrean diacak.`,
            notEnough: `${emoji.error} Lagu di antrean tidak cukup untuk diacak.`,
        },
        remove: {
            description: "Hapus lagu dari antrean.",
            options: {
                position: "Posisi antrean yang akan dihapus.",
            },
            removed: (title: string) => `${emoji.music.remove} **${title}** dihapus dari antrean.`,
            invalid: `${emoji.error} Posisi antrean tidak valid.`,
        },
        seek: {
            description: "Lompat ke posisi tertentu di lagu saat ini.",
            options: {
                position: "Posisi dalam detik.",
            },
            seeked: (time: string) => `${emoji.music.seek} Melompat ke **${time}**.`,
            invalid: `${emoji.error} Tidak bisa melompat di lagu ini.`,
        },
        leave: {
            description: "Putuskan bot dari voice channel.",
            left: `${emoji.music.leave} Keluar dari voice channel.`,
        },
        errors: {
            noVoice: `${emoji.error} Kamu harus masuk ke voice channel dulu.`,
            notSameChannel: `${emoji.error} Kamu harus berada di voice channel yang sama denganku.`,
            noQueue: `${emoji.error} Aku sedang tidak memutar apa pun.`,
            noResults: `${emoji.error} Tidak ada hasil untuk pencarian itu.`,
            loadFailed: `${emoji.error} Gagal memuat lagu tersebut.`,
            nsfw: `${emoji.error} Aku tidak bisa memutar konten terbatas usia di channel non-NSFW.`,
            joinFailed: `${emoji.error} Aku tidak bisa masuk ke voice channel kamu.`,
        },
    },

    components: {
        button: "Halo Dunia dari Tombol",
        select: "Halo Dunia dari Menu Pilih",
        error: "Terjadi error komponen!",
        modalError: "Terjadi error modal!",
    },

    dev: {
        eval: {
            empty: "`❌` Masukkan kode!",
            watcherEnded: (name: string, reason: string, timestamp: number) =>
                `\`📕\` ${name} watcher berakhir <t:${timestamp}:R>. (\`${reason}\`)`,
            type: (typecode: string, ms: number) => `Tipe: ${typecode} | ${ms}ms`,
            errorType: (ms: number) => `Tipe: Error | ${ms}ms`,
        },
        shell: {
            empty: "`❌` Masukkan perintah!",
            watcherEnded: (name: string, reason: string, timestamp: number) =>
                `> ${name} watcher berakhir <t:${timestamp}:R>. (\`${reason}\`)`,
            footer: (ms: number) => `Unix Shell | ${ms} ms`,
            errorFooter: (ms: number) => `Error | ${ms} ms`,
        },
    },
};
