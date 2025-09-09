# /api/trigger_check.py

from flask import Flask, request, jsonify
import requests
import gspread
import json
from datetime import datetime, timedelta, timezone
from google.oauth2.service_account import Credentials

# --- INICIALIZAÇÃO DO FLASK ---
app = Flask(__name__)

# --- DANGER!!! INFORMAÇÕES SENSÍVEIS NO CÓDIGO ---
WEBHOOK_URL = "https://grupoiteq.bitrix24.com.br/rest/1236/8ov7ziteq81uvnmv/"
GOOGLE_SHEET_KEY = "1iplPuPAD2rYDVdon4DWJhfrENiEKvCqU94N5ZArfImM"
SECRET_TOKEN = "uMa-sEnHa-Bem-F0rt3-e-S3cr3tA" # Troque por uma senha complexa

GOOGLE_CREDS_DICT = {
  "type": "service_account",
  "project_id": "bitrix24-posvenda",
  "private_key_id": "653bb95db7e275c932969ad8a94273a73f425ecf",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDSXd9dzNzJauYm\n0p985vBn6vuTZsyMwtNz4bDx7rLwv1/hrVNKe7S3DlAbdvRg0UQysrhdfaeHj34R\nDM/V5rNtfIQDfGe/MIjB6r7HwrM1tKOGDk3JC6mUI13P8F5leqai9OaPccPw1H1M\n9OnxzCffXs3BstxMttbkX9lbcUnh0O/JHLRHinru2GRlYS8HT9NABQBIqkzXpAQY\nOIgXxeCe9tKDjs7kncpqrHKX6jUO3Y+6zZwgyOJqt1uWyPlwnmXv5ftPy/ppnpmJ\nsOvQfSgHeXw053rejSpTkiCKBCSiRyiWSvjAOFaGQFsDClAX2Eu0HCaf2gaGyzHe\nV5LvfVE7AgMBAAECggEAGUmbfiUQLU4iWGxdK6B/KZ6/mxpyYEFTNczdfleZPwNi\nPTiemIeCU7buvj5wZesB7a46J1LhfpQrLVWC7k2LKBAdtmWP+xWUeusC//RRopUS\nSx0REKfMPLh7oHFeh4hU26XgyUF9skd4wHV4Yc6OxHUa+rvLa5VXA6DZ+foGTZSe\nTA3INWuMugTGCK2qsICM/euTwuIrT0ZH7qaNvBVFptFawJdMfX61gje70ZtDhG9w\ntIfdFwmLyw5s8ZW2MxF4ZSi/SlzLDLu6C3fNXKGabfFSX7gHiChL9U+yBCtzf6Cb\n678USTUWj/uhK5tdMHuUH4fv0/FW7hjgB6BZHoT7sQKBgQDvt43WIceYxhoepEJE\nmXGI+1NYLVXg9tGwUbyeCDe6NtuK7sAzGT20YytyT7+H4Gvm3DMNMnZeuE1kyqb/\nChEN20ZQdp9PiCFzpKAc5slQkDhb4wzf4z9f5WqzW2OHONvhyyZtnSCDICjdUabB\nEDjzK424Aoekhj7Enq8BMYe8zQKBgQDgp/Hn22tV7B9ut3JihvrFzReCEm2htXxe\nqd9F8AB6X0zRGq/lyyQyVdfDV3gso4bf6v+hv8Scokn9CUSgGkNm0CajqcsR6DkD\nFfGmihG4J6X7b5tUEf3IbaU0xjQ4cg8y5QqtDZnyCjAmb0aL+uyZv5oWGb3qLUTN\na1H6Fu3GJwKBgDKqvVPxN9rWpFatqUQOmqy1Ulxk2K3//TojTJaqbfzx811eMUmb\noCssetZifL0fdi8Jg9DaRaKnmdQf8UQewJQJMMd5CxsoTsm+lgkFzq80jHT/fI0l\n3xNJzk+ylUrTfcYvxiOM/n44oeqFg5Vy9FaRchbekgT4SvQMBjleWq5RAoGAdXN4\nRiZx5FbxS/n+hEJbYwRJcQhfZrayUe9vummyZkfiqkPQiEv/HY3Bou/c9UF9Jx3+\nDbtreBRkqDSrOyTf7iWOvevsLe2BuPpE/zOZ9fRMk7qSs45AZwPj5kZlUMlY5tvW\nDAlbXa4z5DQy5sYF4o/IaBuHLaIDIX4lOqG4J+sCgYEAy4XE1hri082Huv+IVbba\n/AQVzjdHgOSeB5lnk66XHvrdNLtkb8NoKpsKeoRJZK0atcMbWhkTpgzILg/2T00F\n/syaKs7sfW2sk4O6cZP0fqxgJIJdNIa7cMD0k1OkCQf1epc3O3R4v8Q0zQDIg3Qz\nx63GvQJkPqPXynNZaQ4tpeE=\n-----END PRIVATE KEY-----\n",
  "client_email": "automacao@bitrix24-posvenda.iam.gserviceaccount.com",
  "client_id": "103675608714565960181",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/automacao%40bitrix24-posvenda.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
# --- FIM DAS INFORMAÇÕES SENSÍVEIS ---

# --- Configurações da Lógica ---
TARGET_DEPARTMENT_NAME = "Comercial Interno"
EXCLUDED_USER_IDS = {"40102", "4702", "1230"}
WORKSHEET_NAME = "Dados"
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
]

# --- FUNÇÕES DE LÓGICA ---

def log(message):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def execute_bitrix_method(method, params=None):
    if params is None: params = {}
    url = f"{WEBHOOK_URL}{method}"
    try:
        response = requests.post(url, json=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        log(f"ERRO DE API BITRIX: {e}"); return None

def get_target_users():
    # Esta função permanece a mesma
    log("Buscando usuários do Bitrix...")
    department_id = None
    departments_data = execute_bitrix_method("department.get")
    if departments_data and 'result' in departments_data:
        for dept in departments_data['result']:
            if dept.get('NAME') == TARGET_DEPARTMENT_NAME:
                department_id = dept['ID']; break
    if not department_id:
        log(f"ERRO: Departamento '{TARGET_DEPARTMENT_NAME}' não encontrado."); return {}
    users_data = execute_bitrix_method("user.get", {'filter': {'UF_DEPARTMENT': department_id}})
    if not (users_data and 'result' in users_data):
        log("ERRO: Não foi possível buscar usuários do departamento."); return {}
    target_users = {user['ID']: f"{user.get('NAME', '')} {user.get('LAST_NAME', '')}".strip() for user in users_data['result'] if user['ID'] not in EXCLUDED_USER_IDS}
    log(f"{len(target_users)} usuários encontrados e válidos."); return target_users

def run_check():
    log("Iniciando verificação completa...")
    try:
        creds = Credentials.from_service_account_info(GOOGLE_CREDS_DICT, scopes=SCOPES)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(GOOGLE_SHEET_KEY)
        worksheet = spreadsheet.worksheet(WORKSHEET_NAME)
    except Exception as e:
        log(f"ERRO CRÍTICO: Não foi possível conectar ao Google Sheets. {e}"); return

    log("Lendo IDs existentes na planilha (Coluna K)...")
    existing_ids_from_sheet = set(worksheet.col_values(11)); log(f"{len(existing_ids_from_sheet)} IDs únicos carregados.")
    
    target_users = get_target_users()
    if not target_users: return

    # --- MUDANÇA PRINCIPAL AQUI ---
    # Em vez de uma data fixa, buscamos apenas das últimas 24 horas para evitar timeouts.
    end_date = datetime.now()
    start_date = end_date - timedelta(days=1)
    # --- FIM DA MUDANÇA ---
    
    rows_for_export = []
    log(f"Buscando ligações de {start_date.strftime('%d/%m/%Y %H:%M')} até {end_date.strftime('%d/%m/%Y %H:%M')}.")
    local_tz = timezone(timedelta(hours=-3))
    start_of_period_utc = start_date.astimezone(timezone.utc)
    end_of_period_utc = end_date.astimezone(timezone.utc)

    for user_id, user_name in target_users.items():
        params = {"filter": {"PORTAL_USER_ID": user_id, ">=CALL_START_DATE": start_of_period_utc.isoformat(), "<=CALL_START_DATE": end_of_period_utc.isoformat()}, "order": {"CALL_START_DATE": "ASC"}}
        all_user_calls = []
        for call_type in [1, 2]:
            params["filter"]["CALL_TYPE"] = call_type
            call_data = execute_bitrix_method("voximplant.statistic.get", params)
            if call_data and 'result' in call_data: all_user_calls.extend(call_data['result'])
        
        if not all_user_calls: continue
        
        # O resto do loop de processamento continua igual
        log(f"Processando {len(all_user_calls)} ligações para {user_name}...")
        for call in all_user_calls:
            call_id = call.get('ID')
            if not call_id or call_id in existing_ids_from_sheet: continue
            existing_ids_from_sheet.add(call_id)
            duration = int(call.get('CALL_DURATION', '0'))
            start_date_iso = call.get('CALL_START_DATE')
            try:
                utc_dt = datetime.fromisoformat(start_date_iso.replace('Z', '+00:00'))
                local_dt = utc_dt.astimezone(local_tz)
                call_date_str, call_time_str = local_dt.strftime('%d/%m/%Y'), local_dt.strftime('%H:%M:%S')
            except: call_date_str, call_time_str = "DD/MM/AAAA", "HH:MM:SS"
            call_type_str = "Efetuada" if call.get('CALL_TYPE') == '1' else "Recebida"
            if not (call_type_str == "Recebida" and duration < 60):
                hours, remainder = divmod(duration, 3600)
                minutes, seconds = divmod(remainder, 60)
                duration_formatted = f"{int(hours):02}:{int(minutes):02}:{int(seconds):02}"
                coluna_d, coluna_e, coluna_f = ('', '', '')
                if duration >= 60:
                    if call_type_str == "Efetuada": coluna_d = duration_formatted
                    else: coluna_e = duration_formatted
                else: coluna_f = duration_formatted
                rows_for_export.append([call_date_str, user_name, call_type_str, coluna_d, coluna_e, coluna_f, '', '', '', call_time_str, call_id])

    if rows_for_export:
        log(f"ENCONTRADAS {len(rows_for_export)} NOVAS LIGAÇÕES. Inserindo na planilha...")
        try:
            worksheet.append_rows(rows_for_export, value_input_option='USER_ENTERED')
            log("SUCESSO! Novas ligações inseridas na planilha.")
        except Exception as e: log(f"ERRO AO INSERIR DADOS NA PLANILHA: {e}")
    else: log("Nenhuma nova ligação encontrada neste ciclo.")
    log("Verificação completa finalizada.")

# --- ENDPOINT DO FLASK ---
@app.route('/', defaults={'path': ''}, methods=['GET'])
@app.route('/<path:path>', methods=['GET'])
def handler(path):
    provided_token = request.args.get('token')
    if not SECRET_TOKEN:
        log("ERRO DE CONFIGURAÇÃO: SECRET_TOKEN não foi definido.")
        return jsonify({"status": "error", "message": "Erro de configuração no servidor."}), 500
    if provided_token != SECRET_TOKEN:
        log("Acesso não autorizado.")
        return jsonify({"status": "error", "message": "Acesso não autorizado"}), 401
    try:
        log("Gatilho autorizado recebido. Iniciando a verificação.")
        run_check()
        return jsonify({"status": "success", "message": "Verificação concluída com sucesso."}), 200
    except Exception as e:
        log(f"Erro inesperado durante a execução do handler: {e}")
        return jsonify({"status": "error", "message": "Ocorreu um erro interno no servidor."}), 500
