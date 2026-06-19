# 🍔 Hamburgueria Na Chapa

Sistema completo de gestão para hamburgueria, desenvolvido com foco no controle de pedidos, funcionários, estoque e administração.

---

## 📥 Como testar o projeto

Este repositório está disponível apenas para visualização do código.

Para baixar o sistema completo e executá-lo em sua máquina, utilize o link abaixo:

📎 https://drive.google.com/file/d/1qa-sJKqph4lQvW9QaZVCT3-zycRIxboL/view?usp=sharing

### ⚠️ Atenção

Dentro da pasta disponibilizada há um guia com o passo a passo para instalação e utilização do sistema.

Não é necessário configurar um banco de dados local. Seguindo as instruções do guia, o sistema utilizará o banco de dados hospedado na nuvem (Railway).

> Observação: como o plano utilizado no Railway é gratuito, a primeira conexão pode levar alguns segundos.

---

## 🚀 Tecnologias Utilizadas

* PHP 8+
* MySQL
* HTML5
* CSS3
* JavaScript (Fetch API)
* Railway (Banco de Dados)

---

## 📦 Funcionalidades

**Nesta versão está disponível apenas o perfil de Administrador.**

### 👤 Autenticação

* Login de funcionários;
* Controle de nível de acesso:

  * Administrador;
  * Estoquista;
  * Funcionário.

### 🧾 Gestão de Pedidos

* Criar pedidos;
* Visualizar pedidos;
* Controle de status.

### 📊 Administração

* Controle de funcionários;
* Controle de permissões;
* Registro de logs do sistema.

### 📦 Estoque

* Controle de produtos;
* Atualização de ingredientes;
* Monitoramento de itens disponíveis.

### 🔐 Sistema de Permissões

* Controle de acesso por nível de usuário;
* Ocultação de menus no frontend;
* Proteção das áreas administrativas.

---

## 🗄️ Banco de Dados

O sistema utiliza MySQL e é composto pelas seguintes tabelas principais:

cardapio – cadastro dos produtos disponíveis para venda;
configuracoes – configurações gerais do sistema;
estoque – controle de ingredientes e produtos em estoque;
estoque_movimentacoes – registro de entradas e saídas do estoque;
financeiro – controle financeiro da hamburgueria;
fornecedores – cadastro dos fornecedores;
funcionarios – gerenciamento dos usuários e funcionários do sistema;
logs_sistema – registro das ações realizadas pelos usuários;
pedidos – informações gerais dos pedidos realizados;
pedidos_itens – itens que compõem cada pedido.

O banco de dados está hospedado na plataforma Railway, dispensando configurações adicionais para testes do sistema.

---

## ⚙️ Configuração do Projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/JonathasTrevezani/Hamburgueria-Na-Chapa.git
```
