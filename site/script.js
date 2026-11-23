// tech.html: 구조도 노드를 누르면 설명을 바꾸고, 원정 흐름을 한 단계씩 넘긴다.
(function () {
  var ARCH = {
    react: { t: 'React', b: '로그인 화면, 창, HUD, 메뉴를 그립니다. 로그인부터 광장, 원정으로 넘어가는 큰 화면 전환도 React 가 맡고, 광장과 원정은 서로 다른 Phaser 게임 인스턴스로 띄웁니다.', s: 'TypeScript, React, Vite' },
    phaser: { t: 'Phaser 3', b: '맵, 물리(Arcade), 전투 연출을 맡습니다. 광장과 원정 방, 탑, PvP, 생존 모드가 모두 하나의 전투 장면 클래스이고 「어떤 장소인지」 값만 다릅니다. 방을 옮길 때마다 장면을 새로 만듭니다.', s: 'Phaser 3, Arcade Physics' },
    zustand: { t: 'zustand 저장소', b: 'Phaser 와 React 를 잇는 상태 저장소입니다. 전투 장면이 매 프레임 체력과 쿨타임을 쓰면 HUD 가 읽어 그리고, 창이 열리면 게임 루프를 멈춥니다.', s: 'zustand' },
    shared: { t: 'shared', b: '클라이언트와 서버가 같이 쓰는 콘텐츠 데이터(JSON 93개)와 검증 스키마, 화면과 무관한 규칙(체력, 의태 게이지, 유물 발동, 드랍), 실시간 메시지 타입입니다. 두 쪽이 같은 데이터를 읽는지는 콘텐츠 해시로 확인하고, 다르면 원정 시작을 막습니다.', s: 'TypeScript, Zod' },
    nginx: { t: 'edge nginx', b: '80, 443 을 받아 주소별로 운영과 개발 환경에 나눠 보냅니다. Let\'s Encrypt 인증서를 webroot 방식으로 갱신하고, 업스트림 컨테이너를 요청마다 Docker DNS 로 찾아서 컨테이너 하나가 내려가도 그 경로만 502 가 나게 했습니다. actuator 는 health 만 외부에 엽니다.', s: 'nginx, Let\'s Encrypt', mine: '설정과 운영 전부' },
    client: { t: 'client 컨테이너', b: '빌드된 정적 파일과 그림 묶음을 nginx 로 내보냅니다. 그림 주소에 내용 해시를 붙여 바뀌지 않은 그림은 1년 동안 다시 받지 않습니다.', s: 'nginx, Vite 빌드' },
    api: { t: 'Spring Boot API', b: '계정, 프로필, 원정 판정, 랭킹, 실시간 방, 채팅, 공지, 운영자 기능을 맡습니다. 기능별로 Controller 와 Service 두 층이고, 데이터 접근은 JdbcTemplate 으로 SQL 을 직접 씁니다. 실시간 기능은 WebSocket 연결 하나에 방 종류를 나눠 올렸습니다.', s: 'Java 21, Spring Boot 3, WebSocket', mine: '인증(이메일·Google 로그인, JWT), 원정 저장 첫 구현(체크포인트, 정산), API 명세' },
    mysql: { t: 'MySQL 8', b: '운영과 개발 환경에 각각 하나씩 둡니다. 스키마 변경은 Flyway 마이그레이션(V1 ~ V39)으로만 하고, 1인 1원정 같은 규칙은 UNIQUE 제약으로도 막습니다.', s: 'MySQL 8.4, Flyway', mine: 'ERD, 스키마 설계, Flyway 초기 스키마' },
    jenkins: { t: 'Jenkins', b: 'develop 병합은 GitLab 웹훅으로 개발 서버에 자동 배포하고, 운영은 담당자가 빌드를 직접 실행할 때만 배포합니다. 배포 절차는 deploy.sh 한 파일에 있어 Jenkins 없이도 같은 명령으로 배포할 수 있습니다.', s: 'Jenkins, Generic Webhook Trigger, Bash', mine: '파이프라인과 배포 스크립트' },
    monitor: { t: '모니터링', b: 'Prometheus 가 서버, 컨테이너, MySQL, API 지표를 모으고 Loki 와 Alloy 가 컨테이너 로그를 14일 보관합니다. Grafana 에 운영 대시보드와 플레이 분석 대시보드, 알림 규칙 10개를 두었습니다. 주로 팀원 송XX 가 구성했습니다.', s: 'Prometheus, Grafana, Loki, Alloy', mine: '운영 네트워크 연결, 지표 토큰 보호, nginx 경로' },
    backup: { t: 'DB 백업', b: 'systemd 타이머로 매일 04:00(KST)에 운영과 개발 DB 를 덤프합니다. gzip 검사와 덤프 완료 표시를 확인하고, 14일 보관하되 최신 7개는 날짜와 상관없이 남깁니다.', s: 'systemd, mysqldump', mine: '스크립트와 타이머, 복원 절차' }
  };
  var detail = document.getElementById('arch-detail');
  var nodes = document.querySelectorAll('.node[data-k]');
  function show(k) {
    var d = ARCH[k];
    if (!d || !detail) return;
    nodes.forEach(function (n) { n.setAttribute('aria-pressed', n.dataset.k === k ? 'true' : 'false'); });
    detail.innerHTML = '<h3>' + d.t + '</h3><p>' + d.b + '</p><p class="note">기술: ' + d.s + '</p>' +
      (d.mine ? '<p><span class="chip">제가 맡은 부분</span> ' + d.mine + '</p>' : '');
  }
  nodes.forEach(function (n) { n.addEventListener('click', function () { show(n.dataset.k); }); });
  if (nodes.length) show('api');

  var list = document.querySelectorAll('#run-steps li');
  var prev = document.getElementById('step-prev');
  var next = document.getElementById('step-next');
  var at = 0;
  function render() {
    list.forEach(function (li, i) { li.className = i === at ? 'on' : i < at ? 'done' : ''; });
    if (prev) prev.disabled = at === 0;
    if (next) next.disabled = at === list.length - 1;
  }
  if (prev) prev.addEventListener('click', function () { if (at > 0) { at--; render(); } });
  if (next) next.addEventListener('click', function () { if (at < list.length - 1) { at++; render(); } });
  list.forEach(function (li, i) { li.addEventListener('click', function () { at = i; render(); }); });
  if (list.length) render();
})();
