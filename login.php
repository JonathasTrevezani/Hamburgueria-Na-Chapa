<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');


// Configurações do banco de dados (RAILWAY)
$host = 'junction.proxy.rlwy.net';
$port = '34797';
$dbname = 'railway';
$username = 'root';
$password = 'cTuCKmxxmdMVHbodEuRTCiiRSlqTlknB';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro de conexão com banco',
        'error' => $e->getMessage()
    ]);
    exit;
}

// Verificar ação
$action = $_GET['action'] ?? '';

if ($action !== 'login') {
    echo json_encode([
        'success' => false,
        'message' => 'Ação não reconhecida'
    ]);
    exit;
}

processarLogin($pdo);

function processarLogin($pdo) {

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['email']) || empty($input['senha'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Dados de login incompletos'
        ]);
        exit;
    }

    $email = trim($input['email']);
    $senha = $input['senha'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'Formato de email inválido'
        ]);
        exit;
    }

    try {

        $stmt = $pdo->prepare("
            SELECT id, matricula, nome_completo, email, senha, nivel_acesso, cargo, ativo 
            FROM funcionarios 
            WHERE email = ? AND ativo = TRUE
        ");

        $stmt->execute([$email]);
        $funcionario = $stmt->fetch();

        if (!$funcionario) {
            echo json_encode([
                'success' => false,
                'message' => 'Email não encontrado ou usuário inativo'
            ]);
            exit;
        }

        $senhaBanco = $funcionario['senha'] ?? '';

        if (!password_verify($senha, $senhaBanco)) {
            echo json_encode([
                'success' => false,
                'message' => 'Senha incorreta'
            ]);
            exit;
        }

        registrarLogLogin($pdo, $funcionario['id']);

        echo json_encode([
            'success' => true,
            'message' => 'Login realizado com sucesso!',
            'user' => [
                'id' => $funcionario['id'],
                'matricula' => $funcionario['matricula'],
                'nome' => $funcionario['nome_completo'],
                'email' => $funcionario['email'],
                'nivel' => $funcionario['nivel_acesso'],
                'cargo' => $funcionario['cargo']
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro no servidor',
            'error' => $e->getMessage()
        ]);
        exit;
    }
}

function registrarLogLogin($pdo, $funcionarioId) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO logs_sistema 
            (funcionario_id, acao, descricao, tabela_afetada, registro_id, data, horario, ip) 
            VALUES (?, 'login', 'Login no sistema', 'funcionarios', ?, CURDATE(), CURTIME(), ?)
        ");

        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt->execute([$funcionarioId, $funcionarioId, $ip]);

    } catch (PDOException $e) {
        error_log("Erro ao registrar log: " . $e->getMessage());
    }
}

exit;