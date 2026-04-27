# EC2 접속 방법

## 인스턴스 정보

| 항목 | 값 |
|------|-----|
| 인스턴스 ID | i-0b1ebb5edea89778f |
| 퍼블릭 IP | 98.80.229.24 |
| 퍼블릭 DNS | ec2-98-80-229-24.compute-1.amazonaws.com |
| 유저명 | ubuntu |
| 키 페어 | ku-hys-01-key.pem |
| OS | Ubuntu 24.04 LTS |
| 리전 | us-east-1 |

---

## 방법 1: PowerShell (권장)

```powershell
ssh -i "C:\Users\User\Desktop\CRAI\ku-hys-01-key.pem" ubuntu@98.80.229.24
```

> cmd에서는 안 될 수 있음. PowerShell 사용 권장.

---

## 방법 2: AWS 콘솔 브라우저 접속 (pem 없이)

1. AWS 콘솔 → EC2 → 인스턴스 선택
2. **연결** 버튼 클릭
3. **EC2 Instance Connect** 탭 → **연결** 클릭

---

## pem 키 권한 설정 (처음 한 번만)

Windows에서 pem 파일 권한이 잘못되면 SSH가 거부됨. PowerShell에서 실행:

```powershell
icacls "C:\Users\User\Desktop\CRAI\ku-hys-01-key.pem" /inheritance:r /grant:r "User:R"
```

---

## 보안 그룹 설정

| 포트 | 프로토콜 | 소스 | 용도 |
|------|---------|------|------|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 5432 | TCP | 0.0.0.0/0 | PostgreSQL (RDS) |

---

## 접속 후 프로젝트 실행

```bash
# 프로젝트 디렉토리 이동
cd ~/CRAI/backend

# 스케줄러 백그라운드 실행
nohup python -m scheduler.scheduler > scheduler.log 2>&1 &

# 로그 확인
tail -f scheduler.log

# 실행 중인 프로세스 확인
ps aux | grep scheduler
```
