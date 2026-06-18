<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');


// Log do que está sendo recebido
$inputData = file_get_contents('php://input');
error_log("========== REQUISIÇÃO API ==========");
error_log("GET: " . print_r($_GET, true));
error_log("POST DATA: " . $inputData);
error_log("====================================");

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
            echo json_encode(['success' => false, 'message' => 'Erro de conexão com o banco.']);
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

function calcularStatusEstoque($quantidade, $minimo, $maximo) {
    if ($maximo == 0 || $minimo >= $maximo) return "ok"; 
    
    $percentual = ($quantidade / $maximo) * 100;
    
    if ($quantidade <= $minimo) {
        return "critico";
    } else if ($percentual >= 90) {
        return "maximo";
    } else if ($quantidade <= $minimo * 1.5) {
        return "alerta";
    } else {
        return "ok";
    }
}

// ----------------------
// Roteamento Principal
// ----------------------

// Obter parâmetros
$module = $_GET['module'] ?? '';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$db = (new Database())->getConnection();

// Roteamento baseado no módulo
switch($module) {

    // ===============================
// 🔥 ATUALIZAÇÃO DE STATUS DISPONÍVEL
// ===============================
case "desativar_manual":

    if (!isset($_POST["id"])) {
        echo json_encode(["erro" => true, "msg" => "ID não informado"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = intval($_POST["id"]);
    $motivo = $_POST["motivo"] ?? "Desativado manualmente";

    $sql = $pdo->prepare("
        UPDATE cardapio 
        SET disponivel = 0, motivo_indisponibilidade = :motivo
        WHERE id = :id
    ");

    if ($sql->execute(["motivo" => $motivo, "id" => $id])) {
        echo json_encode(["erro" => false, "msg" => "Item desativado manualmente com sucesso"]);
        exit;
    }

    echo json_encode(["erro" => true, "msg" => "Erro ao desativar item manualmente"]);
    exit;


case "ativar_manual":

    if (!isset($_POST["id"])) {
        echo json_encode(["erro" => true, "msg" => "ID não informado"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = intval($_POST["id"]);

    $sql = $pdo->prepare("
        UPDATE cardapio 
        SET disponivel = 1, motivo_indisponibilidade = NULL
        WHERE id = :id
    ");

    if ($sql->execute(["id" => $id])) {
        echo json_encode(["erro" => false, "msg" => "Item ativado manualmente com sucesso"]);
        exit;
    }

    echo json_encode(["erro" => true, "msg" => "Erro ao ativar item manualmente"]);
    exit;



// ===============================
// 🔥 DESATIVAÇÃO AUTOMÁTICA (ESTOQUE CRÍTICO)
// ===============================
case "auto_critico":

    if (!isset($_POST["id"])) {
        echo json_encode(["erro" => true, "msg" => "ID não informado"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = intval($_POST["id"]);

    $sql = $pdo->prepare("
        UPDATE cardapio
        SET disponivel = 0, motivo_indisponibilidade = 'Estoque crítico'
        WHERE id = :id
    ");

    if ($sql->execute(["id" => $id])) {
        echo json_encode(["erro" => false, "msg" => "Item desativado automaticamente (crítico)"]);
        exit;
    }

    echo json_encode(["erro" => true, "msg" => "Erro ao desativar automaticamente"]);
    exit;



// ===============================
// 🔥 ATIVAÇÃO AUTOMÁTICA (VOLTOU AO NORMAL)
// ===============================
case "auto_normal":

    if (!isset($_POST["id"])) {
        echo json_encode(["erro" => true, "msg" => "ID não informado"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = intval($_POST["id"]);

    $sql = $pdo->prepare("
        UPDATE cardapio
        SET disponivel = 1, motivo_indisponibilidade = NULL
        WHERE id = :id
    ");

    if ($sql->execute(["id" => $id])) {
        echo json_encode(["erro" => false, "msg" => "Item reativado automaticamente"]);
        exit;
    }

    echo json_encode(["erro" => true, "msg" => "Erro ao ativar automaticamente"]);
    exit;

////////////////////////////////////////

    //INICÍO DO MÓDULO DA SESSÃO CADASTROS DA DASHBOARD 

   // ===== MÓDULO DE FORNECEDORES (MySQL) =====
case 'fornecedores':
    switch($action) {
        case 'listar':
            try {
                $stmt = $db->prepare("
                    SELECT 
                        id,
                        cnpj,
                        razao_social,
                        telefone,
                        cep,
                        rua,
                        numero,
                        complemento,
                        bairro,
                        cidade,
                        estado,
                        data_cadastro,
                        email,
                        ativo
                    FROM fornecedores 
                    ORDER BY razao_social
                ");
                $stmt->execute();
                $fornecedores = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (!$fornecedores) {
                    $fornecedores = [];
                }
                
                respond($fornecedores);
            } catch (PDOException $e) {
                error_log("Erro ao buscar fornecedores: " . $e->getMessage());
                respond(['error' => 'Erro ao buscar fornecedores: ' . $e->getMessage()]);
            }
            break;

        case 'adicionar':
            try {
                $required = ['cnpj', 'razao_social', 'telefone', 'email'];
                $check = require_fields($input, $required);
                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                $sql = "INSERT INTO fornecedores (
                    cnpj, 
                    razao_social, 
                    telefone,
                    cep,
                    rua,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    data_cadastro,
                    email,
                    ativo
                ) VALUES (
                    :cnpj,
                    :razao_social,
                    :telefone,
                    :cep,
                    :rua,
                    :numero,
                    :complemento,
                    :bairro,
                    :cidade,
                    :estado,
                    :data_cadastro,
                    :email,
                    :ativo
                )";
                
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':cnpj' => $input['cnpj'] ?? '',
                    ':razao_social' => $input['razao_social'] ?? $input['nome_empresa'] ?? '',
                    ':telefone' => $input['telefone'] ?? '',
                    ':cep' => $input['cep'] ?? '',
                    ':rua' => $input['rua'] ?? '',
                    ':numero' => $input['numero'] ?? '',
                    ':complemento' => $input['complemento'] ?? '',
                    ':bairro' => $input['bairro'] ?? '',
                    ':cidade' => $input['cidade'] ?? '',
                    ':estado' => $input['estado'] ?? '',
                    ':data_cadastro' => $input['data_cadastro'] ?? date('Y-m-d'),
                    ':email' => $input['email'] ?? '',
                    ':ativo' => isset($input['ativo']) ? ($input['ativo'] ? 1 : 0) : 1
                ]);

                $novoId = $db->lastInsertId();
                respond(['success' => true, 'id' => $novoId]);
            } catch (PDOException $e) {
                // Verificar se é erro de duplicado
                if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                    if (strpos($e->getMessage(), 'cnpj') !== false) {
                        respond(['success' => false, 'message' => 'CNPJ já cadastrado no sistema.']);
                    } elseif (strpos($e->getMessage(), 'email') !== false) {
                        respond(['success' => false, 'message' => 'E-mail já cadastrado no sistema.']);
                    }
                }
                error_log("Erro ao adicionar fornecedor: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao adicionar fornecedor: ' . $e->getMessage()]);
            }
            break;

        case 'atualizar':
            try {
                $required = ['id', 'razao_social'];
                $check = require_fields($input, $required);
                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                // Construir SQL dinamicamente
                $fields = [];
                $params = [':id' => $input['id']];
                
                $camposPossiveis = [
                    'cnpj', 'razao_social', 'telefone', 'cep', 'rua', 'numero', 
                    'complemento', 'bairro', 'cidade', 'estado', 'data_cadastro', 
                    'email', 'ativo'
                ];
                
                foreach ($camposPossiveis as $campo) {
                    if (isset($input[$campo])) {
                        $fields[] = "$campo = :$campo";
                        $params[":$campo"] = $input[$campo];
                    }
                }
                
                // Mapear nome_empresa para razao_social se fornecido
                if (isset($input['nome_empresa']) && !isset($input['razao_social'])) {
                    $fields[] = "razao_social = :razao_social";
                    $params[':razao_social'] = $input['nome_empresa'];
                }
                
                if (empty($fields)) {
                    respond(['success' => false, 'message' => 'Nenhum campo para atualizar']);
                }
                
                $sql = "UPDATE fornecedores SET " . implode(', ', $fields) . " WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);

                respond(['success' => true]);
            } catch (PDOException $e) {
                // Verificar se é erro de duplicado
                if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                    if (strpos($e->getMessage(), 'cnpj') !== false) {
                        respond(['success' => false, 'message' => 'CNPJ já cadastrado no sistema.']);
                    } elseif (strpos($e->getMessage(), 'email') !== false) {
                        respond(['success' => false, 'message' => 'E-mail já cadastrado no sistema.']);
                    }
                }
                error_log("Erro ao atualizar fornecedor: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao atualizar fornecedor: ' . $e->getMessage()]);
            }
            break;

        case 'remover':
            try {
                if (!isset($input['id'])) {
                    respond(['success' => false, 'message' => 'ID do fornecedor é obrigatório']);
                }

                // Verificar se fornecedor tem estoque relacionado
                try {
                    $checkStmt = $db->prepare("SELECT COUNT(*) as total FROM estoque WHERE fornecedor_id = :id");
                    $checkStmt->execute([':id' => $input['id']]);
                    $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($result && $result['total'] > 0) {
                        // Não deletar, apenas desativar
                        $sql = "UPDATE fornecedores SET ativo = 0 WHERE id = :id";
                        $stmt = $db->prepare($sql);
                        $stmt->execute([':id' => $input['id']]);
                        respond(['success' => true, 'message' => 'Fornecedor desativado (possui produtos no estoque)']);
                        return;
                    }
                } catch (Exception $e) {
                    // Tabela estoque pode não existir ou não ter o campo fornecedor_id
                    error_log("Aviso ao verificar estoque: " . $e->getMessage());
                }
                
                // Pode deletar
                $sql = "DELETE FROM fornecedores WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute([':id' => $input['id']]);
                
                if ($stmt->rowCount() > 0) {
                    respond(['success' => true, 'message' => 'Fornecedor removido com sucesso']);
                } else {
                    respond(['success' => false, 'message' => 'Fornecedor não encontrado']);
                }
            } catch (PDOException $e) {
                error_log("Erro ao remover fornecedor: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao remover fornecedor: ' . $e->getMessage()]);
            }
            break;

        case 'alternar_status':
            try {
                if (!isset($input['id'])) {
                    respond(['success' => false, 'message' => 'ID do fornecedor é obrigatório']);
                }

                // Buscar estado atual
                $stmt = $db->prepare("SELECT ativo FROM fornecedores WHERE id = :id");
                $stmt->execute([':id' => $input['id']]);
                $fornecedor = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$fornecedor) {
                    respond(['success' => false, 'message' => 'Fornecedor não encontrado']);
                }

                $novoEstado = $fornecedor['ativo'] ? 0 : 1;

                $sql = "UPDATE fornecedores SET ativo = :ativo WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':id' => $input['id'],
                    ':ativo' => $novoEstado
                ]);

                respond(['success' => true, 'novo_status' => $novoEstado]);
            } catch (PDOException $e) {
                error_log("Erro ao alternar status fornecedor: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao alterar status: ' . $e->getMessage()]);
            }
            break;

        default:
            respond(['error' => 'Ação não reconhecida para fornecedores']);
            break;
    }
    break;


// ===== MÓDULO DE FUNCIONÁRIOS (MySQL) =====
case 'funcionarios':
    switch($action) {
        case 'listar':
            try {
                $stmt = $db->prepare("
                    SELECT 
                        id,
                        nome_completo,
                        matricula,
                        cpf,
                        cargo,
                        salario,
                        turno,
                        data_admissao,
                        telefone_celular,
                        email,
                        rua,
                        numero,
                        complemento,
                        bairro,
                        cidade,
                        estado,
                        cep,
                        ativo,
                        nivel_acesso,
                        sexo,
                        data_nascimento,
                        telefone_emergencia
                    FROM funcionarios 
                    ORDER BY nome_completo
                ");
                $stmt->execute();
                $funcionarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (!$funcionarios) {
                    $funcionarios = [];
                }
                
                respond($funcionarios);
            } catch (PDOException $e) {
                error_log("Erro ao buscar funcionários: " . $e->getMessage());
                respond(['error' => 'Erro ao buscar funcionários: ' . $e->getMessage()]);
            }
            break;

        case 'adicionar':
            try {
                $required = ['nome_completo', 'cpf', 'cargo', 'salario', 'telefone_celular', 'email', 'senha'];
                $check = require_fields($input, $required);
                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                $sql = "INSERT INTO funcionarios (
                    nome_completo, 
                    matricula, 
                    cpf, 
                    sexo,
                    data_nascimento,
                    cargo, 
                    salario, 
                    turno,
                    telefone_celular,
                    telefone_emergencia,
                    cep,
                    rua,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    data_admissao,
                    email,
                    senha,
                    nivel_acesso,
                    ativo
                ) VALUES (
                    :nome_completo,
                    :matricula,
                    :cpf,
                    :sexo,
                    :data_nascimento,
                    :cargo,
                    :salario,
                    :turno,
                    :telefone_celular,
                    :telefone_emergencia,
                    :cep,
                    :rua,
                    :numero,
                    :complemento,
                    :bairro,
                    :cidade,
                    :estado,
                    :data_admissao,
                    :email,
                    :senha,
                    :nivel_acesso,
                    :ativo
                )";
                
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':nome_completo' => $input['nome_completo'] ?? '',
                    ':matricula' => $input['matricula'] ?? '',
                    ':cpf' => $input['cpf'] ?? '',
                    ':sexo' => $input['sexo'] ?? 'masculino',
                    ':data_nascimento' => $input['data_nascimento'] ?? date('Y-m-d'),
                    ':cargo' => $input['cargo'] ?? 'funcionario',
                    ':salario' => floatval($input['salario'] ?? 0),
                    ':turno' => $input['turno'] ?? 'manha',
                    ':telefone_celular' => $input['telefone_celular'] ?? '',
                    ':telefone_emergencia' => $input['telefone_emergencia'] ?? $input['telefone_celular'] ?? '',
                    ':cep' => $input['cep'] ?? '',
                    ':rua' => $input['rua'] ?? '',
                    ':numero' => $input['numero'] ?? '',
                    ':complemento' => $input['complemento'] ?? '',
                    ':bairro' => $input['bairro'] ?? '',
                    ':cidade' => $input['cidade'] ?? '',
                    ':estado' => $input['estado'] ?? '',
                    ':data_admissao' => $input['data_admissao'] ?? date('Y-m-d'),
                    ':email' => $input['email'] ?? '',
                    ':senha' => password_hash($input['senha'] ?? '123456', PASSWORD_DEFAULT),
                    ':nivel_acesso' => $input['nivel_acesso'] ?? 'funcionario',
                    ':ativo' => isset($input['ativo']) ? ($input['ativo'] ? 1 : 0) : 1
                ]);

                $novoId = $db->lastInsertId();
                respond(['success' => true, 'id' => $novoId]);
            } catch (PDOException $e) {
                // Verificar se é erro de duplicado
                if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                    if (strpos($e->getMessage(), 'cpf') !== false) {
                        respond(['success' => false, 'message' => 'CPF já cadastrado no sistema.']);
                    } elseif (strpos($e->getMessage(), 'email') !== false) {
                        respond(['success' => false, 'message' => 'E-mail já cadastrado no sistema.']);
                    } elseif (strpos($e->getMessage(), 'matricula') !== false) {
                        respond(['success' => false, 'message' => 'Matrícula já cadastrada no sistema.']);
                    }
                }
                error_log("Erro ao adicionar funcionário: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao adicionar funcionário: ' . $e->getMessage()]);
            }
            break;

        case 'atualizar':
            try {
                $required = ['id', 'nome_completo', 'cargo', 'salario'];
                $check = require_fields($input, $required);
                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                // Construir SQL dinamicamente
                $fields = [];
                $params = [':id' => $input['id']];
                
                $camposPossiveis = [
                    'nome_completo', 'matricula', 'cpf', 'sexo', 'data_nascimento',
                    'cargo', 'salario', 'turno', 'telefone_celular', 'telefone_emergencia',
                    'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado',
                    'data_admissao', 'email', 'nivel_acesso', 'ativo'
                ];
                
                foreach ($camposPossiveis as $campo) {
                    if (isset($input[$campo])) {
                        $fields[] = "$campo = :$campo";
                        $params[":$campo"] = $input[$campo];
                    }
                }
                
                // Se senha foi fornecida, hash it
                if (isset($input['senha']) && !empty($input['senha'])) {
                    $fields[] = "senha = :senha";
                    $params[':senha'] = password_hash($input['senha'], PASSWORD_DEFAULT);
                }
                
                if (empty($fields)) {
                    respond(['success' => false, 'message' => 'Nenhum campo para atualizar']);
                }
                
                $sql = "UPDATE funcionarios SET " . implode(', ', $fields) . " WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);

                respond(['success' => true]);
            } catch (PDOException $e) {
                // Verificar se é erro de duplicado
                if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                    if (strpos($e->getMessage(), 'cpf') !== false) {
                        respond(['success' => false, 'message' => 'CPF já cadastrado no sistema.']);
                    } elseif (strpos($e->getMessage(), 'email') !== false) {
                        respond(['success' => false, 'message' => 'E-mail já cadastrado no sistema.']);
                    } elseif (strpos($e->getMessage(), 'matricula') !== false) {
                        respond(['success' => false, 'message' => 'Matrícula já cadastrada no sistema.']);
                    }
                }
                error_log("Erro ao atualizar funcionário: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao atualizar funcionário: ' . $e->getMessage()]);
            }
            break;

        case 'remover':
            try {
                if (!isset($input['id'])) {
                    respond(['success' => false, 'message' => 'ID do funcionário é obrigatório']);
                }

                // Verificar se funcionário tem pedidos relacionados
                try {
                    $checkStmt = $db->prepare("SELECT COUNT(*) as total FROM pedidos WHERE funcionario_id = :id");
                    $checkStmt->execute([':id' => $input['id']]);
                    $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($result && $result['total'] > 0) {
                        // Não deletar, apenas desativar
                        $sql = "UPDATE funcionarios SET ativo = 0 WHERE id = :id";
                        $stmt = $db->prepare($sql);
                        $stmt->execute([':id' => $input['id']]);
                        respond(['success' => true, 'message' => 'Funcionário desativado (possui registros vinculados)']);
                        return;
                    }
                } catch (Exception $e) {
                    // Tabela pedidos pode não existir ou não ter o campo funcionario_id
                    error_log("Aviso ao verificar pedidos: " . $e->getMessage());
                }
                
                // Pode deletar
                $sql = "DELETE FROM funcionarios WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute([':id' => $input['id']]);
                
                if ($stmt->rowCount() > 0) {
                    respond(['success' => true, 'message' => 'Funcionário removido com sucesso']);
                } else {
                    respond(['success' => false, 'message' => 'Funcionário não encontrado']);
                }
            } catch (PDOException $e) {
                error_log("Erro ao remover funcionário: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao remover funcionário: ' . $e->getMessage()]);
            }
            break;

        case 'alternar_status':
            try {
                if (!isset($input['id'])) {
                    respond(['success' => false, 'message' => 'ID do funcionário é obrigatório']);
                }

                // Buscar estado atual
                $stmt = $db->prepare("SELECT ativo FROM funcionarios WHERE id = :id");
                $stmt->execute([':id' => $input['id']]);
                $funcionario = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$funcionario) {
                    respond(['success' => false, 'message' => 'Funcionário não encontrado']);
                }

                $novoEstado = $funcionario['ativo'] ? 0 : 1;

                $sql = "UPDATE funcionarios SET ativo = :ativo WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':id' => $input['id'],
                    ':ativo' => $novoEstado
                ]);

                respond(['success' => true, 'novo_status' => $novoEstado]);
            } catch (PDOException $e) {
                error_log("Erro ao alternar status funcionário: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao alterar status: ' . $e->getMessage()]);
            }
            break;

        default:
            respond(['error' => 'Ação não reconhecida para funcionários']);
            break;
    }
    break;
    //FIM DO MÓDULO DA SESSÃO CADASTROS DA DASHBOARD

    // ==================== MÓDULO DE RELATÓRIOS CORRIGIDO ====================
    case 'relatorios':
        switch ($action) {
            case 'gerar_relatorio_pedidos':
                try {
                    $data_inicio = $_POST['data_inicio'] ?? '';
                    $data_final = $_POST['data_final'] ?? '';
                    
                    // Converter datas para formato MySQL
                    $data_inicio_mysql = $data_inicio ? date('Y-m-d', strtotime(str_replace('/', '-', $data_inicio))) : date('Y-m-d');
                    $data_final_mysql = $data_final ? date('Y-m-d', strtotime(str_replace('/', '-', $data_final))) : date('Y-m-d');
                    
                    // Buscar pedidos no período com funcionário
                    $stmt = $db->prepare("
                        SELECT 
                            p.*,
                            f.nome_completo as funcionario_nome,
                            (SELECT COUNT(*) FROM pedidos_itens pi WHERE pi.pedido_id = p.id) as total_itens,
                            (SELECT GROUP_CONCAT(CONCAT(pi.item_nome, ' (', pi.quantidade, 'x)') SEPARATOR '; ') 
                             FROM pedidos_itens pi WHERE pi.pedido_id = p.id) as itens
                        FROM pedidos p
                        LEFT JOIN funcionarios f ON p.funcionario_id = f.id
                        WHERE DATE(p.data_pedido) BETWEEN ? AND ?
                        ORDER BY p.data_pedido DESC, p.horario_pedido DESC
                    ");
                    
                    $stmt->execute([$data_inicio_mysql, $data_final_mysql]);
                    $pedidos = $stmt->fetchAll(); // CORRIGIDO: fetchAll() em vez de while
                    
                    $total_vendas = 0;
                    $total_pedidos = count($pedidos);
                    
                    foreach($pedidos as &$pedido) {
                        $total_vendas += floatval($pedido['total'] ?? 0);
                    }
                    
                    // Estatísticas por status
                    $pedidos_entregues = array_filter($pedidos, function($p) {
                        return ($p['status'] ?? '') === 'entregue';
                    });
                    
                    $pedidos_preparo = array_filter($pedidos, function($p) {
                        $status = $p['status'] ?? '';
                        return $status === 'preparando' || $status === 'confirmado';
                    });
                    
                    $pedidos_cancelados = array_filter($pedidos, function($p) {
                        return ($p['status'] ?? '') === 'cancelado';
                    });
                    
                    // Estatísticas por tipo de pedido
                    $pedidos_delivery = array_filter($pedidos, function($p) {
                        return ($p['tipo'] ?? '') === 'Delivery';
                    });
                    
                    $pedidos_local = array_filter($pedidos, function($p) {
                        return ($p['tipo'] ?? '') === 'Local';
                    });
                    
                    // Estatísticas por forma de pagamento
                    $pagamentos = [];
                    foreach($pedidos as $pedido) {
                        $forma = $pedido['forma_pagamento'] ?? 'dinheiro';
                        if(!isset($pagamentos[$forma])) {
                            $pagamentos[$forma] = 0;
                        }
                        $pagamentos[$forma] += floatval($pedido['total'] ?? 0);
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'pedidos' => $pedidos,
                        'estatisticas' => [
                            'total_pedidos' => $total_pedidos,
                            'total_vendas' => number_format($total_vendas, 2, ',', '.'),
                            'pedidos_entregues' => count($pedidos_entregues),
                            'pedidos_preparo' => count($pedidos_preparo),
                            'pedidos_cancelados' => count($pedidos_cancelados),
                            'pedidos_delivery' => count($pedidos_delivery),
                            'pedidos_local' => count($pedidos_local),
                            'ticket_medio' => $total_pedidos > 0 ? number_format($total_vendas / $total_pedidos, 2, ',', '.') : '0,00',
                            'forma_pagamento' => $pagamentos
                        ],
                        'periodo' => [
                            'data_inicio' => $data_inicio,
                            'data_final' => $data_final
                        ]
                    ]);
                    
                } catch (Exception $e) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Erro ao gerar relatório de pedidos: ' . $e->getMessage()
                    ]);
                }
                break;
                
            case 'gerar_relatorio_estoque':
                try {
                    $data_inicio = $_POST['data_inicio'] ?? '';
                    $data_final = $_POST['data_final'] ?? '';
                    
                    // Buscar estoque atual
                    $stmt = $db->prepare("
                        SELECT 
                            e.*,
                            f.razao_social as fornecedor_nome
                        FROM estoque e
                        LEFT JOIN fornecedores f ON e.fornecedor_id = f.id
                        ORDER BY e.status DESC, e.item ASC
                    ");
                    $stmt->execute();
                    $estoque = $stmt->fetchAll(); // CORRIGIDO
                    
                    $itens_criticos = 0;
                    $itens_alerta = 0;
                    $itens_ok = 0;
                    $itens_maximo = 0;
                    $valor_total_estoque = 0;
                    
                    foreach($estoque as &$row) {
                        // Calcular valor total do item
                        $valor_item = floatval($row['quantidade'] ?? 0) * floatval($row['custo_unitario'] ?? 0);
                        $valor_total_estoque += $valor_item;
                        
                        // Determinar status
                        $quantidade = floatval($row['quantidade'] ?? 0);
                        $minimo = floatval($row['minimo'] ?? 0);
                        $maximo = floatval($row['maximo'] ?? 0);
                        
                        if ($quantidade <= $minimo) {
                            $status = 'critico';
                            $itens_criticos++;
                        } else if ($maximo > 0 && ($quantidade / $maximo) >= 0.9) {
                            $status = 'maximo';
                            $itens_maximo++;
                        } else if ($quantidade <= ($minimo * 1.5)) {
                            $status = 'alerta';
                            $itens_alerta++;
                        } else {
                            $status = 'ok';
                            $itens_ok++;
                        }
                        
                        $row['status_calculado'] = $status;
                        $row['valor_total'] = $valor_item;
                        $row['percentual'] = $maximo > 0 ? round(($quantidade / $maximo) * 100, 2) : 0;
                    }
                    
                    // Buscar movimentações do estoque no período - CORRIGIDO
                    $movimentacoes = [];
                    try {
                        $data_inicio_mysql = $data_inicio ? date('Y-m-d', strtotime(str_replace('/', '-', $data_inicio))) : '2000-01-01';
                        $data_final_mysql = $data_final ? date('Y-m-d', strtotime(str_replace('/', '-', $data_final))) : date('Y-m-d');
                        
                        $stmt_mov = $db->prepare("
                            SELECT 
                                em.*,
                                e.item as estoque_item,
                                f.nome_completo as funcionario_nome
                            FROM estoque_movimentacoes em
                            LEFT JOIN estoque e ON em.estoque_id = e.id
                            LEFT JOIN funcionarios f ON em.funcionario_id = f.id
                            WHERE DATE(em.data_movimentacao) BETWEEN ? AND ?
                            ORDER BY em.data_movimentacao DESC
                        ");
                        
                        $stmt_mov->execute([$data_inicio_mysql, $data_final_mysql]);
                        $movimentacoes = $stmt_mov->fetchAll();
                        
                    } catch (Exception $e) {
                        // Tabela pode não existir ainda
                        error_log("Tabela movimentações não existe: " . $e->getMessage());
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'estoque' => $estoque,
                        'movimentacoes' => $movimentacoes,
                        'estatisticas' => [
                            'total_itens' => count($estoque),
                            'itens_criticos' => $itens_criticos,
                            'itens_alerta' => $itens_alerta,
                            'itens_ok' => $itens_ok,
                            'itens_maximo' => $itens_maximo,
                            'valor_total_estoque' => number_format($valor_total_estoque, 2, ',', '.'),
                            'itens_baixo_estoque' => $itens_criticos + $itens_alerta,
                            'itens_com_fornecedor' => count(array_filter($estoque, function($e) {
                                return !empty($e['fornecedor_id']);
                            }))
                        ]
                    ]);
                    
                } catch (Exception $e) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Erro ao gerar relatório de estoque: ' . $e->getMessage()
                    ]);
                }
                break;
                
            case 'gerar_relatorio_cardapio':
                try {
                    // Buscar todos os itens do cardápio
                    $stmt = $db->prepare("
                        SELECT 
                            c.*,
                            (SELECT COUNT(*) FROM cardapio_ingredientes ci WHERE ci.cardapio_id = c.id) as total_ingredientes
                        FROM cardapio c
                        ORDER BY c.categoria, c.disponivel DESC, c.nome ASC
                    ");
                    $stmt->execute();
                    $cardapio = $stmt->fetchAll();
                    
                    $por_categoria = [];
                    $total_itens = 0;
                    $itens_disponiveis = 0;
                    $itens_indisponiveis = 0;
                    $valor_total_cardapio = 0;
                    $lucro_potencial_total = 0;
                    
                    foreach($cardapio as &$row) {
                        $total_itens++;
                        
                        if ($row['disponivel'] == 1) {
                            $itens_disponiveis++;
                        } else {
                            $itens_indisponiveis++;
                        }
                        
                        $preco = floatval($row['preco'] ?? 0);
                        $custo = floatval($row['custo_estimado'] ?? 0);
                        $valor_total_cardapio += $preco;
                        $lucro_potencial = $preco - $custo;
                        $lucro_potencial_total += $lucro_potencial;
                        
                        // Calcular margem de lucro
                        $row['margem_lucro'] = $custo > 0 ? round((($preco - $custo) / $custo) * 100, 2) : 0;
                        $row['lucro_potencial'] = $lucro_potencial;
                        
                        // Agrupar por categoria
                        $categoria = $row['categoria'] ?? 'outro';
                        if (!isset($por_categoria[$categoria])) {
                            $por_categoria[$categoria] = [
                                'itens' => [],
                                'total' => 0,
                                'disponiveis' => 0,
                                'indisponiveis' => 0
                            ];
                        }
                        $por_categoria[$categoria]['itens'][] = $row;
                        $por_categoria[$categoria]['total']++;
                        if ($row['disponivel'] == 1) {
                            $por_categoria[$categoria]['disponiveis']++;
                        } else {
                            $por_categoria[$categoria]['indisponiveis']++;
                        }
                    }
                    
                    // Buscar ingredientes dos itens do cardápio
                    $ingredientes_detalhados = [];
                    try {
                        $stmt_ing = $db->prepare("
                            SELECT 
                                ci.*,
                                c.nome as cardapio_nome,
                                e.item as estoque_item,
                                e.unidade as estoque_unidade
                            FROM cardapio_ingredientes ci
                            LEFT JOIN cardapio c ON ci.cardapio_id = c.id
                            LEFT JOIN estoque e ON ci.estoque_id = e.id
                            ORDER BY c.nome
                        ");
                        $stmt_ing->execute();
                        $ingredientes_detalhados = $stmt_ing->fetchAll();
                    } catch (Exception $e) {
                        error_log("Erro ao buscar ingredientes: " . $e->getMessage());
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'cardapio' => $cardapio,
                        'por_categoria' => $por_categoria,
                        'ingredientes' => $ingredientes_detalhados,
                        'estatisticas' => [
                            'total_itens' => $total_itens,
                            'itens_disponiveis' => $itens_disponiveis,
                            'itens_indisponiveis' => $itens_indisponiveis,
                            'percentual_disponivel' => $total_itens > 0 ? round(($itens_disponiveis / $total_itens) * 100, 2) : 0,
                            'preco_medio' => $total_itens > 0 ? number_format($valor_total_cardapio / $total_itens, 2, ',', '.') : '0,00',
                            'lucro_potencial_total' => number_format($lucro_potencial_total, 2, ',', '.'),
                            'itens_com_ingredientes' => count(array_filter($cardapio, function($c) {
                                return ($c['total_ingredientes'] ?? 0) > 0;
                            }))
                        ]
                    ]);
                    
                } catch (Exception $e) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Erro ao gerar relatório de cardápio: ' . $e->getMessage()
                    ]);
                }
                break;
                
            case 'gerar_relatorio_financeiro':
                try {
                    $data_inicio = $_POST['data_inicio'] ?? date('d/m/Y');
                    $data_final = $_POST['data_final'] ?? date('d/m/Y');
                    
                    // Converter datas
                    $data_inicio_mysql = date('Y-m-d', strtotime(str_replace('/', '-', $data_inicio)));
                    $data_final_mysql = date('Y-m-d', strtotime(str_replace('/', '-', $data_final)));
                    
                    // 1. Buscar vendas (pedidos) no período - CORRIGIDO
                    $stmt_vendas = $db->prepare("
                        SELECT 
                            DATE(p.data_pedido) as data,
                            COUNT(*) as total_pedidos,
                            SUM(p.total) as total_vendas,
                            AVG(p.total) as ticket_medio,
                            SUM(CASE WHEN p.status = 'entregue' THEN p.total ELSE 0 END) as valor_entregue,
                            SUM(CASE WHEN p.status = 'entregue' THEN 1 ELSE 0 END) as pedidos_entregues,
                            SUM(CASE WHEN p.status = 'cancelado' THEN p.total ELSE 0 END) as valor_cancelado,
                            SUM(CASE WHEN p.status = 'cancelado' THEN 1 ELSE 0 END) as pedidos_cancelados,
                            GROUP_CONCAT(DISTINCT p.forma_pagamento) as formas_pagamento
                        FROM pedidos p
                        WHERE DATE(p.data_pedido) BETWEEN ? AND ?
                        GROUP BY DATE(p.data_pedido)
                        ORDER BY DATE(p.data_pedido) DESC
                    ");
                    $stmt_vendas->execute([$data_inicio_mysql, $data_final_mysql]);
                    $dados_financeiros = $stmt_vendas->fetchAll(); // CORRIGIDO
                    
                    $total_geral_vendas = 0;
                    $total_geral_pedidos = 0;
                    $total_entregues = 0;
                    $total_cancelados = 0;
                    
                    foreach($dados_financeiros as $row) {
                        $total_geral_vendas += floatval($row['total_vendas'] ?? 0);
                        $total_geral_pedidos += intval($row['total_pedidos'] ?? 0);
                        $total_entregues += intval($row['pedidos_entregues'] ?? 0);
                        $total_cancelados += intval($row['pedidos_cancelados'] ?? 0);
                    }
                    
                    // 2. Buscar entradas do financeiro - CORRIGIDO
                    $entradas = [];
                    $total_entradas = 0;
                    try {
                        $stmt_entradas = $db->prepare("
                            SELECT 
                                f.*,
                                fn.nome_completo as funcionario_nome,
                                p.numero_pedido
                            FROM financeiro f
                            LEFT JOIN funcionarios fn ON f.funcionario_id = fn.id
                            LEFT JOIN pedidos p ON f.pedido_id = p.id
                            WHERE f.tipo = 'entrada' 
                            AND DATE(f.data) BETWEEN ? AND ?
                            ORDER BY f.data DESC, f.horario DESC
                        ");
                        $stmt_entradas->execute([$data_inicio_mysql, $data_final_mysql]);
                        $entradas = $stmt_entradas->fetchAll();
                        
                        foreach($entradas as $row_ent) {
                            $total_entradas += floatval($row_ent['valor'] ?? 0);
                        }
                    } catch (Exception $e) {
                        error_log("Erro ao buscar entradas: " . $e->getMessage());
                    }
                    
                    // 3. Buscar saídas do financeiro - CORRIGIDO
                    $saidas = [];
                    $total_saidas = 0;
                    try {
                        $stmt_saidas = $db->prepare("
                            SELECT 
                                f.*,
                                fn.nome_completo as funcionario_nome
                            FROM financeiro f
                            LEFT JOIN funcionarios fn ON f.funcionario_id = fn.id
                            WHERE f.tipo = 'saida' 
                            AND DATE(f.data) BETWEEN ? AND ?
                            ORDER BY f.data DESC, f.horario DESC
                        ");
                        $stmt_saidas->execute([$data_inicio_mysql, $data_final_mysql]);
                        $saidas = $stmt_saidas->fetchAll();
                        
                        foreach($saidas as $row_sai) {
                            $total_saidas += floatval($row_sai['valor'] ?? 0);
                        }
                    } catch (Exception $e) {
                        error_log("Erro ao buscar saídas: " . $e->getMessage());
                    }
                    
                    // 4. Buscar salários pagos - CORRIGIDO
                    $salarios = [];
                    $total_salarios = 0;
                    try {
                        $stmt_salarios = $db->prepare("
                            SELECT 
                                f.*,
                                fn.nome_completo as funcionario_nome
                            FROM financeiro f
                            LEFT JOIN funcionarios fn ON f.funcionario_id = fn.id
                            WHERE f.categoria = 'salario' 
                            AND DATE(f.data) BETWEEN ? AND ?
                            ORDER BY f.data DESC
                        ");
                        $stmt_salarios->execute([$data_inicio_mysql, $data_final_mysql]);
                        $salarios = $stmt_salarios->fetchAll();
                        
                        foreach($salarios as $row_sal) {
                            $total_salarios += floatval($row_sal['valor'] ?? 0);
                        }
                    } catch (Exception $e) {
                        error_log("Erro ao buscar salários: " . $e->getMessage());
                    }
                    
                    // 5. Calcular estatísticas
                    $lucro_bruto = $total_geral_vendas - $total_saidas;
                    $margem_lucro = $total_geral_vendas > 0 ? ($lucro_bruto / $total_geral_vendas) * 100 : 0;
                    
                    // Estatísticas por forma de pagamento - CORRIGIDO
                    $pagamentos_estatisticas = [];
                    try {
                        $stmt_pagamentos = $db->prepare("
                            SELECT 
                                forma_pagamento,
                                COUNT(*) as total_pedidos,
                                SUM(total) as total_valor
                            FROM pedidos
                            WHERE DATE(data_pedido) BETWEEN ? AND ?
                            AND status != 'cancelado'
                            GROUP BY forma_pagamento
                            ORDER BY total_valor DESC
                        ");
                        $stmt_pagamentos->execute([$data_inicio_mysql, $data_final_mysql]);
                        $pagamentos_estatisticas = $stmt_pagamentos->fetchAll();
                    } catch (Exception $e) {
                        error_log("Erro ao buscar pagamentos: " . $e->getMessage());
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'dados_financeiros' => $dados_financeiros,
                        'entradas' => $entradas,
                        'saidas' => $saidas,
                        'salarios' => $salarios,
                        'pagamentos_estatisticas' => $pagamentos_estatisticas,
                        'estatisticas' => [
                            'periodo' => $data_inicio . ' a ' . $data_final,
                            'total_vendas' => number_format($total_geral_vendas, 2, ',', '.'),
                            'total_pedidos' => $total_geral_pedidos,
                            'pedidos_entregues' => $total_entregues,
                            'pedidos_cancelados' => $total_cancelados,
                            'ticket_medio' => $total_geral_pedidos > 0 ? number_format($total_geral_vendas / $total_geral_pedidos, 2, ',', '.') : '0,00',
                            'total_entradas' => number_format($total_entradas, 2, ',', '.'),
                            'total_saidas' => number_format($total_saidas, 2, ',', '.'),
                            'total_salarios' => number_format($total_salarios, 2, ',', '.'),
                            'lucro_bruto' => number_format($lucro_bruto, 2, ',', '.'),
                            'margem_lucro' => number_format($margem_lucro, 2, ',', '.') . '%',
                            'dias_com_vendas' => count($dados_financeiros),
                            'taxa_cancelamento' => $total_geral_pedidos > 0 ? number_format(($total_cancelados / $total_geral_pedidos) * 100, 2, ',', '.') . '%' : '0%'
                        ]
                    ]);
                    
                } catch (Exception $e) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Erro ao gerar relatório financeiro: ' . $e->getMessage()
                    ]);
                }
                break;
                
            case 'gerar_relatorio_funcionarios':
                try {
                    // Buscar todos os funcionários
                    $stmt = $db->prepare("
                        SELECT 
                            f.*,
                            (SELECT COUNT(*) FROM pedidos p WHERE p.funcionario_id = f.id) as total_pedidos,
                            (SELECT SUM(p.total) FROM pedidos p WHERE p.funcionario_id = f.id) as total_vendas
                        FROM funcionarios f
                        WHERE f.ativo = 1
                        ORDER BY f.cargo, f.nome_completo
                    ");
                    $stmt->execute();
                    $funcionarios = $stmt->fetchAll(); // CORRIGIDO
                    
                    $por_cargo = [];
                    $total_funcionarios = 0;
                    $total_salarios = 0;
                    
                    foreach($funcionarios as $row) {
                        $total_funcionarios++;
                        $total_salarios += floatval($row['salario'] ?? 0);
                        
                        // Agrupar por cargo
                        $cargo = $row['cargo'] ?? 'outro';
                        if (!isset($por_cargo[$cargo])) {
                            $por_cargo[$cargo] = [
                                'funcionarios' => [],
                                'total' => 0,
                                'total_salarios' => 0
                            ];
                        }
                        $por_cargo[$cargo]['funcionarios'][] = $row;
                        $por_cargo[$cargo]['total']++;
                        $por_cargo[$cargo]['total_salarios'] += floatval($row['salario'] ?? 0);
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'funcionarios' => $funcionarios,
                        'por_cargo' => $por_cargo,
                        'estatisticas' => [
                            'total_funcionarios' => $total_funcionarios,
                            'total_salarios' => number_format($total_salarios, 2, ',', '.'),
                            'salario_medio' => $total_funcionarios > 0 ? number_format($total_salarios / $total_funcionarios, 2, ',', '.') : '0,00',
                            'funcionarios_ativos' => count(array_filter($funcionarios, function($f) {
                                return ($f['ativo'] ?? 0) == 1;
                            })),
                            'funcionarios_inativos' => $total_funcionarios - count(array_filter($funcionarios, function($f) {
                                return ($f['ativo'] ?? 0) == 1;
                            }))
                        ]
                    ]);
                    
                } catch (Exception $e) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Erro ao gerar relatório de funcionários: ' . $e->getMessage()
                    ]);
                }
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Ação não reconhecida']);
        }
        break;
    
    // ===== MÓDULO DE ESTOQUE =====
    case 'estoque':
        switch($action) {
            case 'listar':
                try {
                    $stmt = $db->prepare("SELECT * FROM estoque ORDER BY item");
                    $stmt->execute();
                    $estoque = $stmt->fetchAll();
                    
                    foreach ($estoque as &$item) {
                        $item['status'] = calcularStatusEstoque($item['quantidade'], $item['minimo'], $item['maximo']);
                    }
                    
                    respond($estoque);
                } catch (PDOException $e) {
                    respond(['error' => 'Erro ao buscar estoque: ' . $e->getMessage()]);
                }
                break;

            case 'adicionar':
                try {
                    $required = ['item', 'quantidade', 'minimo', 'maximo', 'unidade'];
                    $check = require_fields($input, $required);
                    if ($check !== true) {
                        respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                    }

                    $status = calcularStatusEstoque($input['quantidade'], $input['minimo'], $input['maximo']);

                    $sql = "INSERT INTO estoque (item, quantidade, minimo, maximo, unidade, status) 
                            VALUES (:item, :quantidade, :minimo, :maximo, :unidade, :status)";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([
                        ':item' => $input['item'],
                        ':quantidade' => $input['quantidade'],
                        ':minimo' => $input['minimo'],
                        ':maximo' => $input['maximo'],
                        ':unidade' => $input['unidade'],
                        ':status' => $status
                    ]);

                    $novoId = $db->lastInsertId();
                    respond(['success' => true, 'id' => $novoId]);
                } catch (PDOException $e) {
                    respond(['success' => false, 'message' => 'Erro ao adicionar item: ' . $e->getMessage()]);
                }
                break;

            case 'atualizar':
                try {
                    $required = ['id', 'item', 'quantidade', 'minimo', 'maximo', 'unidade'];
                    $check = require_fields($input, $required);
                    if ($check !== true) {
                        respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                    }

                    $status = calcularStatusEstoque($input['quantidade'], $input['minimo'], $input['maximo']);

                    $sql = "UPDATE estoque SET item = :item, quantidade = :quantidade, 
                            minimo = :minimo, maximo = :maximo, unidade = :unidade, status = :status 
                            WHERE id = :id";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([
                        ':id' => $input['id'],
                        ':item' => $input['item'],
                        ':quantidade' => $input['quantidade'],
                        ':minimo' => $input['minimo'],
                        ':maximo' => $input['maximo'],
                        ':unidade' => $input['unidade'],
                        ':status' => $status
                    ]);

                    respond(['success' => true]);
                } catch (PDOException $e) {
                    respond(['success' => false, 'message' => 'Erro ao atualizar item: ' . $e->getMessage()]);
                }
                break;

            case 'remover':
                try {
                    if (!isset($input['id'])) {
                        respond(['success' => false, 'message' => 'ID do item é obrigatório']);
                    }

                    $sql = "DELETE FROM estoque WHERE id = :id";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([':id' => $input['id']]);

                    respond(['success' => true]);
                } catch (PDOException $e) {
                    respond(['success' => false, 'message' => 'Erro ao remover item: ' . $e->getMessage()]);
                }
                break;

            case 'ajustar':
                try {
                    $required = ['id', 'quantidade'];
                    $check = require_fields($input, $required);
                    if ($check !== true) {
                        respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                    }

                    $stmt = $db->prepare("SELECT quantidade, minimo, maximo FROM estoque WHERE id = :id");
                    $stmt->execute([':id' => $input['id']]);
                    $item = $stmt->fetch();

                    if (!$item) {
                        respond(['success' => false, 'message' => 'Item não encontrado']);
                    }

                    $novaQuantidade = $item['quantidade'] + $input['quantidade'];
                    if ($novaQuantidade < 0) {
                        respond(['success' => false, 'message' => 'Quantidade não pode ser negativa']);
                    }
                    
                    $novoStatus = calcularStatusEstoque($novaQuantidade, $item['minimo'], $item['maximo']);

                    $sql = "UPDATE estoque SET quantidade = :quantidade, status = :status WHERE id = :id";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([
                        ':id' => $input['id'],
                        ':quantidade' => $novaQuantidade,
                        ':status' => $novoStatus
                    ]);

                    respond(['success' => true]);
                } catch (PDOException $e) {
                    respond(['success' => false, 'message' => 'Erro ao ajustar quantidade: ' . $e->getMessage()]);
                }
                break;

            default:
                respond(['error' => 'Ação não reconhecida para estoque']);
                break;
        }
        break;

          // ===== MÓDULO DE CARDÁPIO =====
        case 'cardapio':
        switch($action) {
           case 'listar':
            try {
                $stmt = $db->prepare("SELECT * FROM cardapio ORDER BY nome");
                $stmt->execute();
                $cardapio = $stmt->fetchAll();
                respond($cardapio);
            } catch (PDOException $e) {
                respond(['error' => 'Erro ao buscar cardápio: ' . $e->getMessage()]);
            }
            break;

        case 'adicionar':
            try {
                $required = ['nome', 'preco', 'categoria', 'descricao', 'ingredientes'];
                $check = require_fields($input, $required);
                if ($check !== true) {
                respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                } 

                // DEBUG: Logar dados recebidos
                error_log("DEBUG Cardápio Adicionar - Dados recebidos:");
                error_log("Nome: " . ($input['nome'] ?? 'NULL'));
                error_log("Preço: " . ($input['preco'] ?? 'NULL'));
                error_log("Imagem: " . ($input['imagem'] ?? 'NULL'));
                error_log("Tipo da imagem: " . gettype($input['imagem'] ?? 'NULL'));
                error_log("Imagem string vazia?: " . (($input['imagem'] ?? '') === '' ? 'SIM' : 'NÃO'));

                // Processa ingredientes (pode ser string ou array)
                $ingredientesValue = is_array($input['ingredientes']) 
                ? json_encode($input['ingredientes']) 
                : $input['ingredientes'];

                // CORREÇÃO: Incluir campo imagem no SQL
                $sql = "INSERT INTO cardapio (nome, preco, categoria, imagem, descricao, ingredientes, disponivel, motivo_indisponibilidade) 
                VALUES (:nome, :preco, :categoria, :imagem, :descricao, :ingredientes, :disponivel, :motivo_indisponibilidade)";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                ':nome' => $input['nome'],
                ':preco' => floatval($input['preco']),
                ':categoria' => $input['categoria'],
                ':imagem' => $input['imagem'] ?? '', // Adicionado campo imagem
                ':descricao' => $input['descricao'],
                ':ingredientes' => $ingredientesValue,
                ':disponivel' => $input['disponivel'] ?? 1,
                ':motivo_indisponibilidade' => $input['motivo_indisponibilidade'] ?? NULL
                ]);

                $novoId = $db->lastInsertId();
                error_log("DEBUG Cardápio Adicionar - Item adicionado com ID: $novoId");
                error_log("DEBUG Cardápio Adicionar - Imagem salva: " . ($input['imagem'] ?? 'NULL'));
        
                respond(['success' => true, 'id' => $novoId]);
                } catch (PDOException $e) {
                error_log("❌ ERRO ao adicionar item no cardápio: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao adicionar item: ' . $e->getMessage()]);
                }
         break;

        case 'atualizar':
            try {
                $required = ['id'];
                $check = require_fields($input, $required);
                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                // DEBUG: Logar dados recebidos
                error_log("DEBUG Cardápio Atualizar - Dados recebidos:");
                error_log("ID: " . ($input['id'] ?? 'NULL'));
                error_log("Imagem: " . ($input['imagem'] ?? 'NULL'));
                error_log("Tipo da imagem: " . gettype($input['imagem'] ?? 'NULL'));

                // Construir SQL dinamicamente
                $campos = [];
                $params = [':id' => $input['id']];
        
               // Campos que podem ser atualizados - ADICIONAR 'imagem'
               $camposPermitidos = ['nome', 'preco', 'categoria', 'imagem', 'descricao', 'ingredientes', 'disponivel', 'motivo_indisponibilidade'];
        
               foreach ($camposPermitidos as $campo) {
                 if (array_key_exists($campo, $input)) {
                 $campos[] = "$campo = :$campo";
                 if ($campo === 'ingredientes' && is_array($input[$campo])) {
                    $params[":$campo"] = json_encode($input[$campo]);
                 } else if ($campo === 'preco') {
                    $params[":$campo"] = floatval($input[$campo]);
                 } else if ($campo === 'imagem') {
                     // Para imagem, garantir que seja string (mesmo se vazia)
                    $params[":$campo"] = is_string($input[$campo]) ? $input[$campo] : (string)$input[$campo];
                    error_log("DEBUG Cardápio Atualizar - Campo 'imagem' será salvo como: " . $params[":$campo"]);
                 } else {
                    $params[":$campo"] = $input[$campo];
                }
            }
        }
        
             if (empty($campos)) {
            respond(['success' => false, 'message' => 'Nenhum campo para atualizar']);
            }
        
            $sql = "UPDATE cardapio SET " . implode(', ', $campos) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            error_log("DEBUG Cardápio Atualizar - Item ID {$input['id']} atualizado com sucesso");
            respond(['success' => true]);
        } catch (PDOException $e) {
            error_log("❌ ERRO ao atualizar item no cardápio: " . $e->getMessage());
            respond(['success' => false, 'message' => 'Erro ao atualizar item: ' . $e->getMessage()]);
        }
        break;

        case 'atualizar_completo':
            try {
                $required = ['id'];
                $check = require_fields($input, $required);
                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                // Construir SQL dinamicamente para atualizar todos os campos necessários
                $campos = [];
                $params = [':id' => $input['id']];
                
                // Campos que podem ser atualizados (incluindo ingredientes para 0)
                $camposPermitidos = ['disponivel', 'motivo_indisponibilidade', 'ingredientes', 'nome', 'preco', 'categoria', 'descricao'];
                
                foreach ($camposPermitidos as $campo) {
                    if (array_key_exists($campo, $input)) {
                        $campos[] = "$campo = :$campo";
                        if ($campo === 'ingredientes') {
                            // Aceita tanto string quanto array para ingredientes
                            if (is_array($input[$campo])) {
                                $params[":$campo"] = json_encode($input[$campo]);
                            } else if ($input[$campo] === 0 || $input[$campo] === '0') {
                                // Se for 0, converte para string "0" para compatibilidade
                                $params[":$campo"] = '0';
                            } else {
                                $params[":$campo"] = $input[$campo];
                            }
                        } else if ($campo === 'preco') {
                            $params[":$campo"] = floatval($input[$campo]);
                        } else {
                            $params[":$campo"] = $input[$campo];
                        }
                    }
                }
                
                if (empty($campos)) {
                    respond(['success' => false, 'message' => 'Nenhum campo para atualizar']);
                }
                
                $sql = "UPDATE cardapio SET " . implode(', ', $campos) . " WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);

                error_log("✅ Cardápio atualizado - ID: {$input['id']} - Campos: " . implode(', ', $campos));
                respond(['success' => true]);
            } catch (PDOException $e) {
                error_log("❌ Erro ao atualizar_completo no cardápio: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao atualizar item: ' . $e->getMessage()]);
            }
            break;

        case 'atualizar_status':
            try {
                $required = ['id', 'disponivel'];
                $check = require_fields($input, $required);
                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                // Preparar dados para atualização
                $campos = ['disponivel = :disponivel'];
                $params = [
                    ':id' => $input['id'],
                    ':disponivel' => $input['disponivel'] ? 1 : 0
                ];
                
                // Adicionar motivo se fornecido
                if (isset($input['motivo'])) {
                    $campos[] = 'motivo_indisponibilidade = :motivo';
                    $params[':motivo'] = $input['motivo'];
                } else if (isset($input['motivo_indisponibilidade'])) {
                    $campos[] = 'motivo_indisponibilidade = :motivo';
                    $params[':motivo'] = $input['motivo_indisponibilidade'];
                } else if ($input['disponivel'] == 0) {
                    $campos[] = 'motivo_indisponibilidade = :motivo';
                    $params[':motivo'] = 'Desativado automaticamente';
                } else {
                    $campos[] = 'motivo_indisponibilidade = NULL';
                }
                
                // Se ingredientes for fornecido (especialmente para 0)
                if (isset($input['ingredientes'])) {
                    $campos[] = 'ingredientes = :ingredientes';
                    $params[':ingredientes'] = $input['ingredientes'];
                }
                
                $sql = "UPDATE cardapio SET " . implode(', ', $campos) . " WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);

                error_log("✅ Status atualizado - ID: {$input['id']} - Status: " . ($input['disponivel'] ? 'ATIVO' : 'INATIVO'));
                respond(['success' => true]);
            } catch (PDOException $e) {
                error_log("❌ Erro ao atualizar_status no cardápio: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao atualizar status: ' . $e->getMessage()]);
            }
            break;

        case 'remover':
            try {
                if (!isset($input['id'])) {
                    respond(['success' => false, 'message' => 'ID do item é obrigatório']);
                }

                $sql = "DELETE FROM cardapio WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute([':id' => $input['id']]);

                respond(['success' => true]);
            } catch (PDOException $e) {
                error_log("Erro ao remover item do cardápio: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao remover item: ' . $e->getMessage()]);
            }
            break;

        case 'alternar_disponibilidade':
            try {
                if (!isset($input['id'])) {
                    respond(['success' => false, 'message' => 'ID do item é obrigatório']);
                }

                $stmt = $db->prepare("SELECT disponivel FROM cardapio WHERE id = :id");
                $stmt->execute([':id' => $input['id']]);
                $item = $stmt->fetch();

                if (!$item) {
                    respond(['success' => false, 'message' => 'Item não encontrado']);
                }

                $novoEstado = $item['disponivel'] ? 0 : 1;
                $motivo = ($novoEstado == 1) ? NULL : ($input['motivo_indisponibilidade'] ?? NULL);

                $sql = "UPDATE cardapio SET disponivel = :disponivel, motivo_indisponibilidade = :motivo_indisponibilidade WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':id' => $input['id'],
                    ':disponivel' => $novoEstado,
                    ':motivo_indisponibilidade' => $motivo
                ]);

                respond(['success' => true, 'novo_estado' => $novoEstado]);
            } catch (PDOException $e) {
                error_log("Erro ao alternar_disponibilidade no cardápio: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao alterar disponibilidade: ' . $e->getMessage()]);
            }
            break;

        case 'verificar_estoque':
            try {
                if (!isset($input['id'])) {
                    respond(['success' => false, 'message' => 'ID do item é obrigatório']);
                }

                // Buscar item do cardápio
                $stmt = $db->prepare("SELECT * FROM cardapio WHERE id = :id");
                $stmt->execute([':id' => $input['id']]);
                $item = $stmt->fetch();

                if (!$item) {
                    respond(['success' => false, 'message' => 'Item não encontrado']);
                }

                // Buscar estoque atual
                $stmtEstoque = $db->prepare("SELECT * FROM estoque");
                $stmtEstoque->execute();
                $estoque = $stmtEstoque->fetchAll();

                // Simular verificação de estoque
                $disponivel = true;
                $motivos = [];
                
                if (!empty($item['ingredientes'])) {
                    $ingredientes = json_decode($item['ingredientes'], true) ?: [];
                    
                    if (is_array($ingredientes) && count($ingredientes) > 0) {
                        foreach ($ingredientes as $ing) {
                            $nomeIng = is_array($ing) ? ($ing['nome'] ?? '') : $ing;
                            $encontrado = false;
                            
                            foreach ($estoque as $e) {
                                if (strcasecmp(trim($e['item']), trim($nomeIng)) === 0) {
                                    $encontrado = true;
                                    
                                    // Verificar se está em estado crítico
                                    if ($e['quantidade'] <= $e['minimo'] || $e['status'] === 'critico') {
                                        $disponivel = false;
                                        $motivos[] = "{$e['item']} em estado crítico";
                                    }
                                    break;
                                }
                            }
                            
                            if (!$encontrado) {
                                $disponivel = false;
                                $motivos[] = "{$nomeIng} não encontrado no estoque";
                            }
                        }
                    }
                }

                $resultado = [
                    'disponivel' => $disponivel,
                    'motivo' => $disponivel ? '' : implode(', ', $motivos)
                ];

                // Se não está disponível, desativar automaticamente
                if (!$disponivel && $item['disponivel'] == 1) {
                    $sql = "UPDATE cardapio SET disponivel = 0, motivo_indisponibilidade = :motivo WHERE id = :id";
                    $stmtUpdate = $db->prepare($sql);
                    $stmtUpdate->execute([
                        ':id' => $input['id'],
                        ':motivo' => $resultado['motivo']
                    ]);
                }

                respond(['success' => true, 'resultado' => $resultado]);
            } catch (PDOException $e) {
                error_log("Erro ao verificar_estoque: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao verificar estoque: ' . $e->getMessage()]);
            }
            break;

        default:
            respond(['error' => 'Ação não reconhecida para cardápio']);
            break;
    }
    break;

    // ===== MÓDULO DE PEDIDOS COM FINANCEIRO INTEGRADO =====
case 'pedidos':
    switch($action) {
        case 'gerar_numero':
            try {
                // Consulta corrigida para extrair corretamente o número do pedido
                $stmt = $db->prepare("SELECT MAX(CAST(SUBSTRING(numero_pedido, 2) AS UNSIGNED)) as ultimo_num FROM pedidos WHERE numero_pedido REGEXP '^#[0-9]+$'");
                $stmt->execute();
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $ultimoNum = isset($result['ultimo_num']) ? intval($result['ultimo_num']) : 0;
                $novoNum = $ultimoNum + 1;
                $numeroFormatado = '#' . str_pad($novoNum, 4, '0', STR_PAD_LEFT);

                respond([
                    'success' => true,
                    'proximo_numero' => $novoNum,
                    'numero' => $novoNum, // Para compatibilidade
                    'numero_formatado' => $numeroFormatado
                ]);

            } catch (PDOException $e) {
                // Fallback em caso de erro
                respond([
                    'success' => true,
                    'proximo_numero' => 1,
                    'numero' => 1,
                    'numero_formatado' => '#0001'
                ]);
            }
            break;

        case 'listar':
    try {
        $stmt = $db->prepare("
            SELECT 
                p.*,
                f.nome_completo as funcionario_nome,
                (SELECT COUNT(*) FROM pedidos_itens pi WHERE pi.pedido_id = p.id) as total_itens
            FROM pedidos p
            LEFT JOIN funcionarios f ON p.funcionario_id = f.id
            ORDER BY p.id DESC
            LIMIT 30
        ");
        $stmt->execute();
        $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Buscar itens para cada pedido separadamente
        foreach ($pedidos as &$pedido) {
            $stmtItens = $db->prepare("
                SELECT 
                    item_nome as nome,
                    preco_unitario as preco,
                    quantidade,
                    subtotal,
                    observacoes
                FROM pedidos_itens 
                WHERE pedido_id = :pedido_id 
                ORDER BY id
            ");
            $stmtItens->execute([':pedido_id' => $pedido['id']]);
            $pedido['itens'] = $stmtItens->fetchAll(PDO::FETCH_ASSOC);
        }

        respond($pedidos);
    } catch (PDOException $e) {
        error_log("Erro ao buscar pedidos: " . $e->getMessage());
        respond(['success' => false, 'message' => 'Erro ao buscar pedidos: ' . $e->getMessage()]);
    }
    break;
    
        case 'criar':
            try {
                error_log("======= CRIANDO NOVO PEDIDO COM FINANCEIRO =======");
                error_log("Dados recebidos: " . json_encode($input, JSON_PRETTY_PRINT));
                
                // Validações
                $required = ['cliente', 'tipo', 'itens', 'total'];
                $check = require_fields($input, $required);
                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                if (empty($input['itens']) || !is_array($input['itens'])) {
                    respond(['success' => false, 'message' => "Nenhum item no pedido"]);
                }

                // Iniciar transação
                $db->beginTransaction();

                try {
                    // 1. Gerar número do pedido
                    $stmt = $db->prepare("SELECT MAX(CAST(SUBSTRING(numero_pedido, 2) AS UNSIGNED)) as ultimo_num FROM pedidos WHERE numero_pedido REGEXP '^#[0-9]+$'");
                    $stmt->execute();
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                    $ultimoNum = isset($result['ultimo_num']) ? intval($result['ultimo_num']) : 0;
                    $novoNum = $ultimoNum + 1;
                    $numeroPedido = '#' . str_pad($novoNum, 4, '0', STR_PAD_LEFT);

                    // 2. Preparar dados do pedido
                    $tipo = $input['tipo'];
                    $cliente = trim($input['cliente']);
                    $telefone = isset($input['telefone']) ? trim($input['telefone']) : '';
                    $observacao = isset($input['observacao']) ? trim($input['observacao']) : '';
                    $total = floatval($input['total']);
                    
                    // Forma de pagamento (padrão: dinheiro)
                    $formaPagamento = isset($input['forma_pagamento']) ? $input['forma_pagamento'] : 'dinheiro';
                    
                    // Obter funcionário ID (default: 1 - altere conforme sua sessão)
                    $funcionarioId = 1; // TODO: Obter da sessão: $_SESSION['usuario_id'] ?? 1
                    
                    // Dados específicos do tipo
                   $mesa = null;
                   $cep = null; $rua = null; $numeroEndereco = null; $complemento = null;
                   $bairro = null; $cidade = null; $estado = null;

            if ($tipo === 'Local' && isset($input['mesa']) && $input['mesa'] !== '' && $input['mesa'] !== null) {
                $mesa = intval($input['mesa']);
            } elseif ($tipo === 'Delivery') {
            if (isset($input['endereco']) && is_array($input['endereco'])) {
                $endereco = $input['endereco'];
                $cep = !empty($endereco['cep']) ? $endereco['cep'] : null;
                $rua = !empty($endereco['rua']) ? $endereco['rua'] : null;
                $numeroEndereco = !empty($endereco['numero']) ? $endereco['numero'] : null;
                $complemento = !empty($endereco['complemento']) ? $endereco['complemento'] : null;
                $bairro = !empty($endereco['bairro']) ? $endereco['bairro'] : null;
                $cidade = !empty($endereco['cidade']) ? $endereco['cidade'] : null;
                $estado = !empty($endereco['estado']) ? $endereco['estado'] : null;
            } else {
            // Mantém compatibilidade com formato antigo
                $cep = !empty($input['cep']) ? $input['cep'] : null;
                $rua = !empty($input['rua']) ? $input['rua'] : null;
                $numeroEndereco = !empty($input['numero']) ? $input['numero'] : null;
                $complemento = !empty($input['complemento']) ? $input['complemento'] : null;
                $bairro = !empty($input['bairro']) ? $input['bairro'] : null;
                $cidade = !empty($input['cidade']) ? $input['cidade'] : null;
                $estado = !empty($input['estado']) ? $input['estado'] : null;
            }
        }

                    error_log("Inserindo pedido: $numeroPedido - Cliente: $cliente - Tipo: $tipo - Total: R$ $total");

                    // 3. Inserir pedido (verifique se a coluna forma_pagamento existe)
                    try {
                        $sqlPedido = "INSERT INTO pedidos 
                            (numero_pedido, tipo, nome_cliente, telefone_cliente, funcionario_id,
                             mesa_numero, cep, rua, numero_endereco, complemento, bairro, cidade, estado, 
                             observacao, data_pedido, horario_pedido, total, status, forma_pagamento)
                            VALUES
                            (:numero_pedido, :tipo, :cliente, :telefone, :funcionario_id,
                             :mesa, :cep, :rua, :numero_endereco, :complemento, :bairro, :cidade, :estado,
                             :observacao, CURDATE(), CURTIME(), :total, 'aberto', :forma_pagamento)";
                        
                        $stmtPedido = $db->prepare($sqlPedido);
                        $stmtPedido->execute([
                            ':numero_pedido' => $numeroPedido,
                            ':tipo' => $tipo,
                            ':cliente' => $cliente,
                            ':telefone' => $telefone,
                            ':funcionario_id' => $funcionarioId,
                            ':mesa' => $mesa,
                            ':cep' => $cep,
                            ':rua' => $rua,
                            ':numero_endereco' => $numeroEndereco,
                            ':complemento' => $complemento,
                            ':bairro' => $bairro,
                            ':cidade' => $cidade,
                            ':estado' => $estado,
                            ':observacao' => $observacao,
                            ':total' => $total,
                            ':forma_pagamento' => $formaPagamento
                        ]);
                    } catch (PDOException $e) {
                        // Se falhar por causa da coluna forma_pagamento, tenta sem ela
                        if (strpos($e->getMessage(), 'forma_pagamento') !== false) {
                            error_log("Coluna forma_pagamento não existe, inserindo sem ela");
                            $sqlPedido = "INSERT INTO pedidos 
                                (numero_pedido, tipo, nome_cliente, telefone_cliente, funcionario_id,
                                 mesa_numero, cep, rua, numero_endereco, complemento, bairro, cidade, estado, 
                                 observacao, data_pedido, horario_pedido, total, status)
                                VALUES
                                (:numero_pedido, :tipo, :cliente, :telefone, :funcionario_id,
                                 :mesa, :cep, :rua, :numero_endereco, :complemento, :bairro, :cidade, :estado,
                                 :observacao, CURDATE(), CURTIME(), :total, 'aberto')";
                            
                            $stmtPedido = $db->prepare($sqlPedido);
                            $stmtPedido->execute([
                                ':numero_pedido' => $numeroPedido,
                                ':tipo' => $tipo,
                                ':cliente' => $cliente,
                                ':telefone' => $telefone,
                                ':funcionario_id' => $funcionarioId,
                                ':mesa' => $mesa,
                                ':cep' => $cep,
                                ':rua' => $rua,
                                ':numero_endereco' => $numeroEndereco,
                                ':complemento' => $complemento,
                                ':bairro' => $bairro,
                                ':cidade' => $cidade,
                                ':estado' => $estado,
                                ':observacao' => $observacao,
                                ':total' => $total
                            ]);
                        } else {
                            throw $e;
                        }
                    }

                    $pedidoId = $db->lastInsertId();
                    error_log("✅ Pedido inserido com ID: $pedidoId");

                    // 4. Inserir itens do pedido
                    $sqlItens = $db->prepare("
                        INSERT INTO pedidos_itens
                        (pedido_id, cardapio_id, item_nome, preco_unitario, quantidade, subtotal, observacoes)
                        VALUES (:pedido_id, :cardapio_id, :nome, :preco, :qtd, :subtotal, :obs)
                    ");

                    $itensInseridos = 0;
                    foreach ($input['itens'] as $item) {
                        if (!isset($item['nome']) || !isset($item['preco']) || !isset($item['quantidade'])) {
                            error_log("Item inválido: " . json_encode($item));
                            continue;
                        }
                        
                        $cardapioId = $item['cardapio_id'] ?? $item['id'] ?? 0;
                        $itemNome = trim($item['nome']);
                        $preco = floatval($item['preco']);
                        $quantidade = intval($item['quantidade']);
                        $subtotal = isset($item['total']) ? floatval($item['total']) : ($preco * $quantidade);
                        $obs = isset($item['observacoes']) ? trim($item['observacoes']) : '';

                        $sqlItens->execute([
                            ':pedido_id' => $pedidoId,
                            ':cardapio_id' => $cardapioId,
                            ':nome' => $itemNome,
                            ':preco' => $preco,
                            ':qtd' => $quantidade,
                            ':subtotal' => $subtotal,
                            ':obs' => $obs
                        ]);
                        
                        $itensInseridos++;
                    }

                    error_log("✅ Total de itens inseridos: $itensInseridos");

                    if ($itensInseridos === 0) {
                        $db->rollBack();
                        respond(['success' => false, 'message' => 'Nenhum item válido no pedido']);
                    }

                    // 5. REGISTRAR NO FINANCEIRO (CRÍTICO)
                    try {
                        $descricaoFinanceiro = "Venda - Pedido $numeroPedido - Cliente: $cliente";
                        if (!empty($observacao)) {
                            $descricaoFinanceiro .= " - Obs: " . substr($observacao, 0, 50);
                        }
                        
                        $sqlFinanceiro = "INSERT INTO financeiro 
                            (pedido_id, tipo, categoria, descricao, valor, data, horario, funcionario_id, forma_pagamento)
                            VALUES (:pedido_id, 'entrada', 'venda', :descricao, :valor, CURDATE(), CURTIME(), :funcionario_id, :forma_pagamento)";
                        
                        $stmtFinanceiro = $db->prepare($sqlFinanceiro);
                        $stmtFinanceiro->execute([
                            ':pedido_id' => $pedidoId,
                            ':descricao' => $descricaoFinanceiro,
                            ':valor' => $total,
                            ':funcionario_id' => $funcionarioId,
                            ':forma_pagamento' => $formaPagamento
                        ]);
                        
                        $financeiroId = $db->lastInsertId();
                        error_log("✅ Registro financeiro inserido com ID: $financeiroId");
                        
                    } catch (PDOException $e) {
                        // Se a tabela financeiro não existir ou der erro, apenas loga
                        error_log("⚠️ Aviso: Não foi possível registrar no financeiro: " . $e->getMessage());
                        $financeiroId = null;
                        // Não faz rollback, apenas continua
                    }

                    // 6. DAR BAIXA NO ESTOQUE (se necessário)
                    if (isset($input['baixar_estoque']) && $input['baixar_estoque'] === true && isset($input['itens_estoque'])) {
                        foreach ($input['itens_estoque'] as $itemEstoque) {
                            if (isset($itemEstoque['estoque_id']) && isset($itemEstoque['quantidade_usada'])) {
                                $stmtEstoque = $db->prepare("
                                    UPDATE estoque 
                                    SET quantidade = quantidade - :quantidade 
                                    WHERE id = :estoque_id AND quantidade >= :quantidade
                                ");
                                $stmtEstoque->execute([
                                    ':estoque_id' => $itemEstoque['estoque_id'],
                                    ':quantidade' => $itemEstoque['quantidade_usada']
                                ]);
                            }
                        }
                    }

                    // 7. Commit da transação
                    $db->commit();
                    error_log("✅ Transação commitada com sucesso!");

                    respond([
                        'success' => true,
                        'id' => $pedidoId,
                        'pedido_id' => $pedidoId,
                        'numero_pedido' => $numeroPedido,
                        'financeiro_id' => $financeiroId,
                        'message' => 'Pedido criado com sucesso!'
                    ]);

                } catch (PDOException $e) {
                    // Rollback em caso de erro
                    $db->rollBack();
                    error_log("❌ ERRO na transação: " . $e->getMessage());
                    throw $e;
                }

            } catch (Exception $e) {
                error_log("❌ ERRO ao criar pedido: " . $e->getMessage());
                respond(['success' => false, 'message' => 'Erro ao criar pedido: ' . $e->getMessage()]);
            }
            break;

        case 'detalhes':
            try {
                if (!isset($input['id']) && !isset($_GET['id'])) {
                    respond(['success' => false, 'message' => 'ID do pedido é obrigatório']);
                }
                
                $pedidoId = $input['id'] ?? $_GET['id'];

                // Buscar pedido
                $stmt = $db->prepare("
                    SELECT 
                        p.*,
                        f.nome_completo as funcionario_nome
                    FROM pedidos p
                    LEFT JOIN funcionarios f ON p.funcionario_id = f.id
                    WHERE p.id = :id
                ");
                $stmt->execute([':id' => $pedidoId]);
                $pedido = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$pedido) {
                    respond(['success' => false, 'message' => 'Pedido não encontrado']);
                }

                // Buscar itens do pedido
                $stmtItens = $db->prepare("
                    SELECT * FROM pedidos_itens 
                    WHERE pedido_id = :pedido_id 
                    ORDER BY id
                ");
                $stmtItens->execute([':pedido_id' => $pedidoId]);
                $itens = $stmtItens->fetchAll(PDO::FETCH_ASSOC);

                // Buscar registro no financeiro relacionado
                $financeiro = null;
                try {
                    $stmtFinanceiro = $db->prepare("
                        SELECT * FROM financeiro 
                        WHERE pedido_id = :pedido_id 
                        ORDER BY id DESC LIMIT 1
                    ");
                    $stmtFinanceiro->execute([':pedido_id' => $pedidoId]);
                    $financeiro = $stmtFinanceiro->fetch(PDO::FETCH_ASSOC);
                } catch (Exception $e) {
                    // Ignora erro se tabela financeiro não existir
                }

                respond([
                    'success' => true,
                    'pedido' => $pedido,
                    'itens' => $itens,
                    'financeiro' => $financeiro
                ]);

            } catch (PDOException $e) {
                respond(['success' => false, 'message' => 'Erro ao buscar detalhes: ' . $e->getMessage()]);
            }
            break;

        case 'atualizar_status':
            try {
                $required = ['id', 'status'];
                $check = require_fields($input, $required);

                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                $sql = "UPDATE pedidos SET status = :status WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':id' => $input['id'],
                    ':status' => $input['status']
                ]);

                // Se o pedido for cancelado, também cancelar no financeiro
                if ($input['status'] === 'cancelado') {
                    try {
                        $sqlFinanceiro = "UPDATE financeiro SET categoria = 'cancelamento' WHERE pedido_id = :pedido_id";
                        $stmtFinanceiro = $db->prepare($sqlFinanceiro);
                        $stmtFinanceiro->execute([':pedido_id' => $input['id']]);
                    } catch (Exception $e) {
                        error_log("Aviso: Não foi possível atualizar financeiro para cancelado: " . $e->getMessage());
                    }
                }

                respond(['success' => true]);

            } catch (PDOException $e) {
                respond(['success' => false, 'message' => 'Erro ao atualizar status: ' . $e->getMessage()]);
            }
            break;

        case 'atualizar_pagamento':
            try {
                $required = ['id', 'forma_pagamento'];
                $check = require_fields($input, $required);

                if ($check !== true) {
                    respond(['success' => false, 'message' => "Campo obrigatório faltando: {$check}"]);
                }

                // Atualizar no pedido
                $sql = "UPDATE pedidos SET forma_pagamento = :forma_pagamento WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':id' => $input['id'],
                    ':forma_pagamento' => $input['forma_pagamento']
                ]);

                // Atualizar também no financeiro
                try {
                    $sqlFinanceiro = "UPDATE financeiro SET forma_pagamento = :forma_pagamento WHERE pedido_id = :pedido_id";
                    $stmtFinanceiro = $db->prepare($sqlFinanceiro);
                    $stmtFinanceiro->execute([
                        ':pedido_id' => $input['id'],
                        ':forma_pagamento' => $input['forma_pagamento']
                    ]);
                } catch (Exception $e) {
                    error_log("Aviso: Não foi possível atualizar forma de pagamento no financeiro: " . $e->getMessage());
                }

                respond(['success' => true]);

            } catch (PDOException $e) {
                respond(['success' => false, 'message' => 'Erro ao atualizar forma de pagamento: ' . $e->getMessage()]);
            }
            break;

        default:
            respond(['success' => false, 'message' => 'Ação não reconhecida em pedidos']);
            break;
    }
    break;
    // ===== MÓDULO DEFAULT =====
    default:
        respond(['error' => 'Módulo não reconhecido']);
        break;
}
?>