import os
import oss2
from oss2.credentials import StaticCredentialsProvider

# --- 配置参数 ---
# 密钥从环境变量读取，不写进文件（避免推到公开仓库泄露）
#   PowerShell:  $env:OSS_KEY_ID = "..." ; $env:OSS_KEY_SECRET = "..."
ACCESS_KEY_ID = os.environ.get('OSS_KEY_ID', '')
ACCESS_KEY_SECRET = os.environ.get('OSS_KEY_SECRET', '')

ENDPOINT = 'oss-cn-beijing.aliyuncs.com'  # 和图片 bucket 同地域
BUCKET_NAME = 'lantech'  # 图片/CLI 共用 bucket
# 要上传的本地包
LOCAL_FILE = './lantech-cli.tgz'
# OSS 上的目标路径（cli/ 目录下，对应 https://cli.lantech.top/lantech-cli.tgz）
OSS_KEY = 'cli/lantech-cli.tgz'

# 初始化
auth = oss2.ProviderAuth(StaticCredentialsProvider(ACCESS_KEY_ID, ACCESS_KEY_SECRET))
bucket = oss2.Bucket(auth, ENDPOINT, BUCKET_NAME)


def delete_if_exists(key):
    """删除 OSS 上已存在的旧包"""
    if bucket.object_exists(key):
        print(f"正在删除旧包: {key} ...")
        bucket.delete_object(key)
        print("删除完成。")
    else:
        print(f"OSS 上不存在旧包 {key}，跳过删除。")


def upload_file(local_path, key):
    """上传本地包，不设强缓存（每次都回源校验，保证 update 能拉到最新版本）"""
    print(f"开始上传 {local_path} -> {key} ...")
    headers = {
        # 不做强缓存：CLI 包文件名固定不带 hash，必须让客户端每次校验最新版本
        'Cache-Control': 'no-cache'
    }
    with open(local_path, 'rb') as fileobj:
        bucket.put_object(key, fileobj, headers=headers)
    print(f"--- 部署成功！https://cli.lantech.top/{key} ---")


if __name__ == '__main__':
    if not ACCESS_KEY_ID or not ACCESS_KEY_SECRET:
        print("错误: 未设置密钥环境变量 OSS_KEY_ID / OSS_KEY_SECRET")
        raise SystemExit(1)

    if not os.path.exists(LOCAL_FILE):
        print(f"错误: 找不到本地包 {LOCAL_FILE}，请先执行 npm pack 并重命名为 lantech-cli.tgz")
        raise SystemExit(1)

    # 1. 先删除旧包
    delete_if_exists(OSS_KEY)

    # 2. 上传新包
    upload_file(LOCAL_FILE, OSS_KEY)
