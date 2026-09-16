interface Teacher {
    name: string;
    email: string;
}

interface WeekBucket {
    startDate: string;
    endDate: string;
    deadline: string;
    teachers: { [key: string]: { submissions: string[]; total: number; late: number; lastSubmission: string } };
}

function isoDateUTC(d: Date): string { return d.toISOString().slice(0, 10); }
function pad(n: number): string { return String(n).padStart(2, "0"); }

function parseExcelDate(text: string): Date | null {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const native = new Date(raw);
    if (!Number.isNaN(native.getTime())) return native;
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return null;
    return new Date(Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2]), Number(m[4] || 0) - 4, Number(m[5] || 0), Number(m[6] || 0)));
}

function uaeIso(d: Date): string {
    const shifted = new Date(d.getTime() + 4 * 60 * 60 * 1000);
    return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth()+1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}+04:00`;
}

function main(workbook: ExcelScript.Workbook): string {
    const teachers: Teacher[] = [
        { name: "Saidah Khwar", email: "saidah.khwar@moe.sch.ae" },
        { name: "Saba Al manaee", email: "saba.almanaei@moe.sch.ae" },
        { name: "Huda Eissa", email: "huda.eissa@moe.sch.ae" },
        { name: "Sara Al Obaidli", email: "sara.alobaidli@moe.sch.ae" },
        { name: "Eman Abdulkareem", email: "eman.abdulla@moe.sch.ae" },
        { name: "Al reem Alahbabi", email: "reem-hj.alahbabi@moe.sch.ae" },
        { name: "Nadia Adnan", email: "nadia.abujwaid@moe.sch.ae" },
        { name: "Mina Adel", email: "mina.alhalabi@moe.sch.ae" },
        { name: "Huda Deeb", email: "huda.deeb@moe.sch.ae" },
        { name: "Laila Saleh", email: "laila.buqshah@moe.sch.ae" }
    ];
    const teacherByEmail: { [key: string]: Teacher } = {};
    teachers.forEach(t => teacherByEmail[t.email.toLowerCase()] = t);

    const table = workbook.getTable("Table2");
    const rows: string[][] = table.getRangeBetweenHeaderAndTotal().getTexts();
    const termStart = Date.UTC(2026, 7, 31); // Mon 31 Aug 2026 = Week 1
    const weeks: { [key: string]: WeekBucket } = {};

    rows.forEach((row: string[]) => {
        const teacher = teacherByEmail[String(row[1] || "").trim().toLowerCase()];
        const submitted = parseExcelDate(row[2]);
        const term = String(row[3] || "").trim().toLowerCase();
        const link = String(row[6] || "").trim();
        if (!teacher || !submitted || term !== "term 1" || !link) return;

        const uaeMs = submitted.getTime() + 4 * 60 * 60 * 1000;
        const shifted = new Date(uaeMs);
        const submittedDay = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
        const weekNumber = Math.floor((submittedDay - termStart) / 604800000) + 1;
        if (weekNumber < 1) return;

        const monday = new Date(termStart + (weekNumber - 1) * 604800000);
        const friday = new Date(monday.getTime() + 4 * 86400000);
        const key = String(weekNumber);
        if (!weeks[key]) weeks[key] = {
            startDate: isoDateUTC(monday),
            endDate: isoDateUTC(friday),
            deadline: `${isoDateUTC(monday)}T12:00:00+04:00`,
            teachers: {}
        };
        if (!weeks[key].teachers[teacher.name]) weeks[key].teachers[teacher.name] = { submissions: [], total: 0, late: 0, lastSubmission: "" };
        const stamp = uaeIso(submitted);
        const bucket = weeks[key].teachers[teacher.name];
        if (!bucket.submissions.some((s: string) => s.endsWith(`|${link}`))) bucket.submissions.push(`${stamp}|${link}`);
    });

    Object.keys(weeks).forEach((wk: string) => {
        const deadlineMs = new Date(weeks[wk].deadline).getTime();
        Object.keys(weeks[wk].teachers).forEach((name: string) => {
            const bucket = weeks[wk].teachers[name];
            const stamps = bucket.submissions.map((x: string) => x.split("|")[0]).sort();
            bucket.submissions = stamps;
            bucket.total = stamps.length;
            bucket.late = stamps.filter((s: string) => new Date(s).getTime() > deadlineMs).length;
            bucket.lastSubmission = stamps.length ? stamps[stamps.length - 1] : "";
        });
    });

    const payload = {
        updatedAt: uaeIso(new Date()),
        terms: {
            "Term 1": { weeks },
            "Term 2": { weeks: {} },
            "Term 3": { weeks: {} }
        }
    };
    return `window.WEEKLY_LESSON_PLAN_DATA = ${JSON.stringify(payload)};`;
}
