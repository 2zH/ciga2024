import { kv } from "@vercel/kv";
import { groupBy } from "lodash";
import { NextResponse } from "next/server";

type ResponseData = {
  message: string
}

type Tombstone = {
  name: string;
  story: string;
  location: string;
}

type DreamFloor = {
  name: string;
  deadthDirection: string[];
  tombstones?: Tombstone[];
}

const dreamFloors : DreamFloor[] = [
  { name: '迷惘', deadthDirection: ['right'] },
  { name: '恐惧', deadthDirection: ['up', 'left'] },
  { name: '喜悦', deadthDirection: ['right', 'up'] },
  { name: '悲伤', deadthDirection: ['right', 'left'] },
  { name: '焦虑', deadthDirection: ['right', 'left'] },
  { name: '安宁', deadthDirection: [] },
  { name: '激动', deadthDirection: ['up'] },
  { name: '愤怒', deadthDirection: ['up'] },
  { name: '感动', deadthDirection: [] },
  { name: '惊讶', deadthDirection: ['left'] },
  { name: '无助', deadthDirection: ['left', 'right'] },
  { name: '兴奋', deadthDirection: [] },
  { name: '失望', deadthDirection: ['up', 'right'] },
  { name: '舒适', deadthDirection: ['left', 'right'] },
  { name: '懊悔', deadthDirection: ['left', 'right'] },
  { name: '疑惑', deadthDirection: ['up', 'right'] },
  { name: '孤独', deadthDirection: ['left', 'right'] },
  { name: '满足', deadthDirection: [] },
  { name: '内疚', deadthDirection: ['up', 'left'] },
  { name: '恶心', deadthDirection: ['left', 'right'] },
  { name: '羞愧', deadthDirection: ['up', 'right'] },
  { name: '欣慰', deadthDirection: ['up', 'left'] },
  { name: '沮丧', deadthDirection: ['left', 'right'] },
  { name: '激情', deadthDirection: ['up', 'right'] },
  { name: '震惊', deadthDirection: ['left', 'right'] },
  { name: '温暖', deadthDirection: [] },
]

export async function GET(Request: Request) {
  const tombstones = await kv.lrange<Tombstone>(`tombstones`, 0, -1)

  if (tombstones != null) {
    const tombstonesByDreamFloor = groupBy(tombstones, 'name');
    // 随机打乱顺序
    const dreamFloorsWithTombstones = dreamFloors
      .sort(() => Math.random() - 0.5)
      .map(dreamFloor => ({
        ...dreamFloor,
        tombstones: tombstonesByDreamFloor[dreamFloor.name]
      }))

    return NextResponse.json(dreamFloorsWithTombstones);
  }

  return NextResponse.json(dreamFloors);
}

const callgpt = async (text: string, lastWord: string) : Promise<{ reply: { text: string } }> => {
  const prompt = `仅使用给出的以下词为主题或连接词，写一首神秘风格的现代诗，要求每一个词只用额外的一句话作为修饰，并以句号分割。以'我经历了xxx'为开头，用'我最终在${lastWord}面前倒下'作为结尾`;
  const response = await fetch('https://bot.taugocauci.dev/api/gpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      prompt,
    })
  });

  return response.json();
}

export async function POST(Request: Request) {
  const { lastWord, location, words } = await Request.json();
  const { reply } = await callgpt(JSON.stringify(words), lastWord);
  const tombstone = {
    name: lastWord,
    story: reply.text,
    location,
  }
  await kv.lpush(`tombstones`, JSON.stringify(tombstone));

  return NextResponse.json(tombstone);
}
