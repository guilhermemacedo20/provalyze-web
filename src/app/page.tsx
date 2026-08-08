"use client";

import { FormEvent, useEffect, useState } from "react";
import { usersService, type User } from "@/services/users.service";

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await usersService.list();
    setUsers(data);
  }

  useEffect(() => {
    load().catch((e) => setError(String(e.message || e)));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await usersService.create({ name, email });
      setName("");
      setEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 p-8">
      <h1 className="text-2xl font-semibold">PFC</h1>

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border bg-white p-4"
      >
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
          type="submit"
        >
          Criar
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="rounded border bg-white px-3 py-2 text-sm">
            {u.name} — {u.email}
          </li>
        ))}
      </ul>
    </main>
  );
}
