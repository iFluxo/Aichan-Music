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
