import React, { useState } from 'react';

// 论坛作者显示组件：已注册账号在昵称旁显示头像，点击头像切换显示发布者 ID
export default function ForumAuthor({ author, userMap }) {
  const [showId, setShowId] = useState(false);

  const name = author || '匿名鹿友';
  const user = userMap?.[name];

  if (!user) {
    return <span>👤 {name}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setShowId((v) => !v)}
        className="shrink-0 transition transform hover:scale-105"
        title={showId ? `ID: ${user.id}` : `点击查看 ${name} 的 ID`}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={name}
            className="w-5 h-5 rounded-full object-cover border border-zinc-200"
          />
        ) : (
          <span className="w-5 h-5 rounded-full bg-[#88abac]/20 text-[#88abac] flex items-center justify-center text-[10px] font-bold border border-[#88abac]/30">
            {name[0]}
          </span>
        )}
      </button>
      <span className="truncate max-w-[100px] text-zinc-600 font-medium">{name}</span>
      {showId && (
        <span className="text-[10px] font-mono text-[#88abac]">#{user.id}</span>
      )}
    </span>
  );
}
