# EC2 서버 가이드

## 인스턴스 정보

| 항목 | 값 |
|------|-----|
| 인스턴스 ID | i-0b1ebb5edea89778f |
| 퍼블릭 IP | 98.80.229.24 |
| 유저명 | ubuntu |
| 키 페어 | ku-hys-01-key.pem |
| OS | Ubuntu 24.04 LTS |
| 리전 | us-east-1 (미국 동부) |
| 인스턴스 타입 | t3.small |

> **주의:** EC2는 실행 중일 때 비용이 발생합니다. 장기간 사용하지 않을 때는 AWS 콘솔에서 **중지(Stop)** 해두세요. 종료(Terminate)는 인스턴스가 삭제되므로 주의.

---

## 1. SSH 접속 (PowerShell 권장)

> cmd에서는 접속이 안 될 수 있습니다. **PowerShell**에서 실행하세요.

```powershell
ssh -i "C:\Users\User\Desktop\CRAI\ku-hys-01-key.pem" ubuntu@98.80.229.24
```

접속 성공 시 아래와 같은 프롬프트가 뜹니다:
```
ubuntu@ip-172-31-36-121:~$
```

### pem 키 권한 설정 (처음 한 번만)

접속이 안 될 경우 PowerShell에서 실행:
```powershell
icacls "C:\Users\User\Desktop\CRAI\ku-hys-01-key.pem" /inheritance:r /grant:r "User:R"
```

---

## 2. VSCode Remote SSH로 접속

### 준비
1. VSCode에서 **Remote - SSH** 확장 설치
2. **F1 → Remote-SSH: Open SSH Configuration File → `C:\Users\User\.ssh\config`** 선택
3. 아래 내용 추가 후 저장:

```
Host crai-ec2
    HostName 98.80.229.24
    User ubuntu
    IdentityFile C:\Users\User\Desktop\CRAI\ku-hys-01-key.pem
```

### 접속
1. VSCode 왼쪽 아래 `><` 버튼 클릭
2. **Connect to Host** 클릭
3. `crai-ec2` 선택
4. Linux 선택
5. **Open Folder → `/home/ubuntu/CRAI`** 선택

---

## 3. AWS 콘솔에서 브라우저로 접속 (pem 없이)

1. AWS 콘솔 → EC2 → 인스턴스 선택
2. **연결** 버튼 클릭
3. **EC2 Instance Connect** 탭 → **연결** 클릭

---

## 4. 처음 서버 세팅 (최초 1회)

EC2에 처음 접속했을 때 아래 순서로 세팅합니다.

### 코드 clone
```bash
git clone https://github.com/t2easure/CRAI.git
cd CRAI/backend
```

> GitHub 인증 필요 시 Username: `t2easure`, Password: GitHub Personal Access Token 입력

### 패키지 설치
```bash
pip install -r requirements.txt
playwright install chromium
```

### .env 파일 생성
```bash
cat > ~/CRAI/.env << 'EOF'
APIFY_API_TOKEN=apify_api_MRuM2Xlld2kHhbp4tCGShAaoSnGB6A0vwTgW
DATABASE_URL=postgresql://postgres:canvas2026@ku-hys-01-db.cgxkyy4aox5u.us-east-1.rds.amazonaws.com:5432/crai?sslmode=require
EOF
```

### RDS 연결 테스트
```bash
cd ~/CRAI/backend
python3 -c "from dotenv import load_dotenv; load_dotenv('../.env'); from db.database import _get_connection; conn = _get_connection(); print('RDS 연결 성공'); conn.close()"
```

`RDS 연결 성공` 이 뜨면 준비 완료.

---

## 5. 코드 업데이트 (GitHub에서 최신 코드 받기)

```bash
cd ~/CRAI
git pull origin main
```

---

## 6. 스케줄러 실행

### 백그라운드 실행 (터미널 닫아도 유지)
```bash
cd ~/CRAI/backend
nohup python3 -m scheduler.scheduler > scheduler.log 2>&1 &
```

### 로그 확인
```bash
tail -f ~/CRAI/backend/scheduler.log
```

### 실행 중인지 확인
```bash
ps aux | grep scheduler
```

### 스케줄러 중지
```bash
# PID 확인 후 종료
ps aux | grep scheduler
kill <PID>
```

---

## 7. RDS 데이터 확인

EC2에서 psql로 직접 확인:

```bash
psql "postgresql://postgres:canvas2026@ku-hys-01-db.cgxkyy4aox5u.us-east-1.rds.amazonaws.com:5432/crai?sslmode=require"
```

접속 후 쿼리:
```sql
-- 전체 수집 건수
SELECT COUNT(*) FROM posts;

-- 소스별 건수
SELECT source, COUNT(*) FROM posts GROUP BY source;

-- 게임별 건수
SELECT game, COUNT(*) FROM posts GROUP BY game;

-- 최근 크롤링 로그
SELECT * FROM crawl_logs ORDER BY run_at DESC LIMIT 10;
```

종료: `\q`

---

## 8. EC2 비용 주의사항

| 상태 | 비용 |
|------|------|
| 실행 중 (Running) | 시간당 과금 |
| 중지 (Stopped) | 스토리지 비용만 (매우 저렴) |
| 종료 (Terminated) | 무료 (인스턴스 삭제됨) |

- 장기간 사용하지 않을 때 → **중지(Stop)**
- 프로젝트 완전 종료 시 → **종료(Terminate)**
- **절대 Terminate 누르지 말 것** (데이터 및 설정 전부 삭제)

---

## 9. 보안 그룹 설정

| 포트 | 용도 | 허용 IP |
|------|------|---------|
| 22 | SSH | 0.0.0.0/0 |
| 5432 | PostgreSQL (RDS) | 0.0.0.0/0 |
