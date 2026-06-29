import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 锁定 Turbopack 根目录到 frontend：仓库含多 lockfile 时 Turbopack 会误把
  // 仓库根（E:\play\gaokaozhiyuan）当项目根，进而扫描 backend/.venv 等海量
  // 无关文件，在慢盘上导致页面编译卡死。显式指定 root 避免该推断。
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
