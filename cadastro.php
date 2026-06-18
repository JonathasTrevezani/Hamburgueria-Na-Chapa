<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

// ----------------------
// Configurações DB - RAILWAY
// ----------------------
class Database {
    private $host = "junction.proxy.rlwy.net";
    private $port = "34797";
    private $db_name = "railway";
    private $username = "root";
    private $password = "cTuCKmxxmdMVHbodEuRTCiiRSlqTlknB";
    public $db = null;

    public function getConnection() {
        if ($this->db) return $this->db;
        try {
            $this->db = new PDO(
                "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4",
                $this->username,
                $this->password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro de conexão: ' . $e->getMessage()]);
            exit;
        }
        return $this->db;
    }
}

// ----------------------
// Helpers
// ----------------------
function respond($payload) {
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_fields($data, $fields) {
    foreach ($fields as $f) {
        if (!array_key_exists($f, $data) || $data[$f] === null || (is_string($data[$f]) && trim($data[$f]) === '')) {
            return $f;
        }
    }
    return true;
}

// ----------------------
// Rota
// ----------------------
$action = $_GET['action'] ?? '';

if ($action !== 'cadastro') {
    respond(['success' => false, 'message' => 'Ação inválida. Use action=cadastro']);
}

// Ler JSON enviado pelo front-end
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    respond(['success' => false, 'message' => 'JSON inválido ou vazio.']);
}

$tipo = $data['tipoCadastro'] ?? ($data['tipo'] ?? '');

$db = (new Database())->getConnection();

try {
    if ($tipo === 'funcionario') {
        // Valores padrão para campos opcionais
        $numero = !empty($data['numero']) ? $data['numero'] : 'S/N';
        $complemento = !empty($data['complemento']) ? $data['complemento'] : null;
        $telefoneEmergencia = !empty($data['telefone_emergencia']) ? $data['telefone_emergencia'] : ($data['telefone_celular'] ?? '');
        
        // Campos obrigatórios (numero removido da lista)
        $required = ['cpf','nome_completo','sexo','data_nascimento','cargo','salario','turno',
                    'nivel_acesso','telefone_celular','cep','rua','bairro','cidade',
                    'estado','data_admissao','email','senha'];
        $check = require_fields($data, $required);
        if ($check !== true) respond(['success'=>false,'message'=>"Campo obrigatório faltando: {$check}"]);

        // Verifica duplicidade por cpf ou email
        $stmt = $db->prepare("SELECT id FROM funcionarios WHERE cpf = :cpf OR email = :email");
        $stmt->execute([':cpf' => $data['cpf'], ':email' => $data['email']]);
        if ($stmt->fetch()) respond(['success'=>false,'message'=>'CPF ou E-mail já cadastrado como funcionário.']);

        // Hash da senha
        $senhaHash = password_hash($data['senha'], PASSWORD_DEFAULT);

        // Gerar matrícula automática
        $stmt = $db->query("SELECT MAX(CAST(matricula AS UNSIGNED)) as ultima FROM funcionarios WHERE matricula REGEXP '^[0-9]+$'");
        $result = $stmt->fetch();
        $novaMatricula = str_pad(($result['ultima'] ?? 0) + 1, 3, '0', STR_PAD_LEFT);

        // Nivel de acesso
        $nivel = $data['nivel_acesso'] ?? 'funcionario';
        $niveisPermitidos = ['admin', 'estoquista', 'funcionario'];
        if (!in_array($nivel, $niveisPermitidos)) {
            $nivel = 'funcionario';
        }
        
        // Converter salário para número
        $salario = floatval(str_replace(',', '.', str_replace('.', '', $data['salario'])));

        $sql = "INSERT INTO funcionarios (
            matricula, cpf, nome_completo, sexo, data_nascimento, cargo, salario, turno,
            telefone_celular, telefone_emergencia, cep, rua, numero, complemento, bairro,
            cidade, estado, data_admissao, email, senha, nivel_acesso
        ) VALUES (
            :matricula, :cpf, :nome, :sexo, :nasc, :cargo, :salario, :turno,
            :tel, :tel_emerg, :cep, :rua, :numero, :comp, :bairro,
            :cidade, :estado, :admissao, :email, :senha, :nivel
        )";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':matricula' => $novaMatricula,
            ':cpf' => $data['cpf'],
            ':nome' => $data['nome_completo'],
            ':sexo' => $data['sexo'],
            ':nasc' => $data['data_nascimento'],
            ':cargo' => $data['cargo'],
            ':salario' => $salario,
            ':turno' => $data['turno'],
            ':tel' => $data['telefone_celular'],
            ':tel_emerg' => $telefoneEmergencia,
            ':cep' => $data['cep'],
            ':rua' => $data['rua'],
            ':numero' => $numero,
            ':comp' => $complemento,
            ':bairro' => $data['bairro'],
            ':cidade' => $data['cidade'],
            ':estado' => $data['estado'],
            ':admissao' => $data['data_admissao'],
            ':email' => $data['email'],
            ':senha' => $senhaHash,
            ':nivel' => $nivel
        ]);

        respond([
            'success'=>true,
            'message'=>'Funcionário cadastrado com sucesso!',
            'user'=>[
                'matricula'=>$novaMatricula,
                'nome'=>$data['nome_completo'],
                'cargo'=>$data['cargo'],
                'nivel_acesso'=>$nivel
            ]
        ]);
    

    } elseif ($tipo === 'empresa' || $tipo === 'fornecedor') {
        // Valores padrão
        $numero = !empty($data['numero']) ? $data['numero'] : 'S/N';
        $complemento = !empty($data['complemento']) ? $data['complemento'] : null;
        
        // Campos obrigatórios
        $required = ['cnpj','razao_social','telefone','cep','rua','bairro','cidade','estado','email'];
        $check = require_fields($data, $required);
        if ($check !== true) respond(['success'=>false,'message'=>"Campo obrigatório faltando: {$check}"]);

        // Verifica duplicidade por CNPJ ou email
        $stmt = $db->prepare("SELECT id FROM fornecedores WHERE cnpj = :cnpj OR email = :email");
        $stmt->execute([':cnpj' => $data['cnpj'], ':email' => $data['email']]);
        if ($stmt->fetch()) respond(['success'=>false,'message'=>'CNPJ ou E-mail já cadastrado como fornecedor.']);

        $sql = "INSERT INTO fornecedores (
            cnpj, razao_social, telefone, cep, rua, numero, complemento,
            bairro, cidade, estado, data_cadastro, email
        ) VALUES (
            :cnpj, :razao, :tel, :cep, :rua, :numero, :comp,
            :bairro, :cidade, :estado, CURDATE(), :email
        )";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':cnpj'=>$data['cnpj'],
            ':razao'=>$data['razao_social'],
            ':tel'=>$data['telefone'],
            ':cep'=>$data['cep'],
            ':rua'=>$data['rua'],
            ':numero'=>$numero,
            ':comp'=>$complemento,
            ':bairro'=>$data['bairro'],
            ':cidade'=>$data['cidade'],
            ':estado'=>$data['estado'],
            ':email'=>$data['email']
        ]);

        respond(['success'=>true,'message'=>'Fornecedor cadastrado com sucesso!']);
    } else {
        respond(['success'=>false,'message'=>'Tipo de cadastro inválido.']);
    }
} catch (PDOException $ex) {
    // MOSTRA O ERRO REAL
    respond(['success'=>false,'message'=>'Erro no servidor: ' . $ex->getMessage()]);
} catch (Exception $ex) {
    respond(['success'=>false,'message'=>'Erro geral: ' . $ex->getMessage()]);
}
?>