failed to get console mode for stdout: The handle is invalid.
PGDMP  3    3                |         
   db_vacancy    16.3 (Debian 16.3-1.pgdg120+1)    16.3 (Debian 16.3-1.pgdg120+1) :    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            �           1262    16384 
   db_vacancy    DATABASE     u   CREATE DATABASE db_vacancy WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';
    DROP DATABASE db_vacancy;
                postgres    false                        2615    53402    public    SCHEMA     2   -- *not* creating schema, since initdb creates it
 2   -- *not* dropping schema, since initdb creates it
                postgres    false            �           0    0    SCHEMA public    COMMENT         COMMENT ON SCHEMA public IS '';
                   postgres    false    5            �           0    0    SCHEMA public    ACL     +   REVOKE USAGE ON SCHEMA public FROM PUBLIC;
                   postgres    false    5            b           1247    53443    Provider    TYPE     F   CREATE TYPE public."Provider" AS ENUM (
    'GOOGLE',
    'YANDEX'
);
    DROP TYPE public."Provider";
       public          postgres    false    5            Y           1247    53413    Role    TYPE     ?   CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'USER'
);
    DROP TYPE public."Role";
       public          postgres    false    5            �            1259    57462 ,   13476fac-f0dd-4df9-939e-c5da4b349875_vacancy    TABLE     8  CREATE TABLE public."13476fac-f0dd-4df9-939e-c5da4b349875_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."13476fac-f0dd-4df9-939e-c5da4b349875_vacancy";
       public         heap    postgres    false    5            �            1259    65575 ,   40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy    TABLE     8  CREATE TABLE public."40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy";
       public         heap    postgres    false    5            �            1259    65582 ,   43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy    TABLE     8  CREATE TABLE public."43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy";
       public         heap    postgres    false    5            �            1259    65561 ,   4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy    TABLE     8  CREATE TABLE public."4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy";
       public         heap    postgres    false    5            �            1259    65547 ,   638358d5-173a-4488-86e0-bde6f56c3f61_vacancy    TABLE     8  CREATE TABLE public."638358d5-173a-4488-86e0-bde6f56c3f61_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."638358d5-173a-4488-86e0-bde6f56c3f61_vacancy";
       public         heap    postgres    false    5            �            1259    65568 ,   96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy    TABLE     8  CREATE TABLE public."96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy";
       public         heap    postgres    false    5            �            1259    53403    _prisma_migrations    TABLE     �  CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);
 &   DROP TABLE public._prisma_migrations;
       public         heap    postgres    false    5            �            1259    65603 ,   b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy    TABLE     8  CREATE TABLE public."b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy";
       public         heap    postgres    false    5            �            1259    65589 ,   b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy    TABLE     8  CREATE TABLE public."b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy";
       public         heap    postgres    false    5            �            1259    65596 ,   d59df63e-a644-487d-8838-91ddb1896649_vacancy    TABLE     8  CREATE TABLE public."d59df63e-a644-487d-8838-91ddb1896649_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."d59df63e-a644-487d-8838-91ddb1896649_vacancy";
       public         heap    postgres    false    5            �            1259    65554 ,   e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy    TABLE     8  CREATE TABLE public."e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy" (
    id bigint NOT NULL,
    title_vacancy character varying(255),
    url_vacancy text,
    title_company character varying(255),
    url_company text,
    vacancy_status character varying(50),
    response_date timestamp without time zone
);
 B   DROP TABLE public."e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy";
       public         heap    postgres    false    5            �            1259    53614    profiles    TABLE     �  CREATE TABLE public.profiles (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    avatar text,
    balance double precision DEFAULT 0.0 NOT NULL,
    spin_count integer DEFAULT 0 NOT NULL,
    successful_responses_count integer DEFAULT 0 NOT NULL,
    current_status text NOT NULL,
    user_id text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);
    DROP TABLE public.profiles;
       public         heap    postgres    false    5            �            1259    53613    profiles_id_seq    SEQUENCE     �   CREATE SEQUENCE public.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.profiles_id_seq;
       public          postgres    false    5    219            �           0    0    profiles_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;
          public          postgres    false    218            �            1259    53425    tokens    TABLE     �   CREATE TABLE public.tokens (
    token text NOT NULL,
    exp timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL,
    user_agent text NOT NULL
);
    DROP TABLE public.tokens;
       public         heap    postgres    false    5            �            1259    53417    users    TABLE     T  CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    roles public."Role"[],
    provider public."Provider",
    is_blocked boolean DEFAULT false NOT NULL
);
    DROP TABLE public.users;
       public         heap    postgres    false    5    866    857            �           2604    53617    profiles id    DEFAULT     j   ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);
 :   ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    218    219    219            w          0    57462 ,   13476fac-f0dd-4df9-939e-c5da4b349875_vacancy 
   TABLE DATA           �   COPY public."13476fac-f0dd-4df9-939e-c5da4b349875_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    220            |          0    65575 ,   40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy 
   TABLE DATA           �   COPY public."40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    225            }          0    65582 ,   43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy 
   TABLE DATA           �   COPY public."43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    226            z          0    65561 ,   4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy 
   TABLE DATA           �   COPY public."4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    223            x          0    65547 ,   638358d5-173a-4488-86e0-bde6f56c3f61_vacancy 
   TABLE DATA           �   COPY public."638358d5-173a-4488-86e0-bde6f56c3f61_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    221            {          0    65568 ,   96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy 
   TABLE DATA           �   COPY public."96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    224            r          0    53403    _prisma_migrations 
   TABLE DATA           �   COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
    public          postgres    false    215            �          0    65603 ,   b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy 
   TABLE DATA           �   COPY public."b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    229            ~          0    65589 ,   b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy 
   TABLE DATA           �   COPY public."b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    227                      0    65596 ,   d59df63e-a644-487d-8838-91ddb1896649_vacancy 
   TABLE DATA           �   COPY public."d59df63e-a644-487d-8838-91ddb1896649_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    228            y          0    65554 ,   e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy 
   TABLE DATA           �   COPY public."e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy" (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date) FROM stdin;
    public          postgres    false    222            v          0    53614    profiles 
   TABLE DATA           �   COPY public.profiles (id, first_name, last_name, avatar, balance, spin_count, successful_responses_count, current_status, user_id, updated_at) FROM stdin;
    public          postgres    false    219            t          0    53425    tokens 
   TABLE DATA           B   COPY public.tokens (token, exp, "userId", user_agent) FROM stdin;
    public          postgres    false    217            s          0    53417    users 
   TABLE DATA           i   COPY public.users (id, email, password, created_at, updated_at, roles, provider, is_blocked) FROM stdin;
    public          postgres    false    216            �           0    0    profiles_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.profiles_id_seq', 40, true);
          public          postgres    false    218            �           2606    57468 ^   13476fac-f0dd-4df9-939e-c5da4b349875_vacancy 13476fac-f0dd-4df9-939e-c5da4b349875_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."13476fac-f0dd-4df9-939e-c5da4b349875_vacancy"
    ADD CONSTRAINT "13476fac-f0dd-4df9-939e-c5da4b349875_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."13476fac-f0dd-4df9-939e-c5da4b349875_vacancy" DROP CONSTRAINT "13476fac-f0dd-4df9-939e-c5da4b349875_vacancy_pkey";
       public            postgres    false    220            �           2606    65581 ^   40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy 40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy"
    ADD CONSTRAINT "40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy" DROP CONSTRAINT "40790d87-9bb0-4d8c-a6fa-42f605619649_vacancy_pkey";
       public            postgres    false    225            �           2606    65588 ^   43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy 43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy"
    ADD CONSTRAINT "43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy" DROP CONSTRAINT "43f7f1c5-3131-4ac4-9dda-07b29bce07d0_vacancy_pkey";
       public            postgres    false    226            �           2606    65567 ^   4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy 4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy"
    ADD CONSTRAINT "4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy" DROP CONSTRAINT "4b5a8d2e-35ca-4bd0-add3-89b4439fc6f2_vacancy_pkey";
       public            postgres    false    223            �           2606    65553 ^   638358d5-173a-4488-86e0-bde6f56c3f61_vacancy 638358d5-173a-4488-86e0-bde6f56c3f61_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."638358d5-173a-4488-86e0-bde6f56c3f61_vacancy"
    ADD CONSTRAINT "638358d5-173a-4488-86e0-bde6f56c3f61_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."638358d5-173a-4488-86e0-bde6f56c3f61_vacancy" DROP CONSTRAINT "638358d5-173a-4488-86e0-bde6f56c3f61_vacancy_pkey";
       public            postgres    false    221            �           2606    65574 ^   96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy 96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy"
    ADD CONSTRAINT "96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy" DROP CONSTRAINT "96e63ee0-52ea-4cbf-b49c-ac610573b880_vacancy_pkey";
       public            postgres    false    224            �           2606    53411 *   _prisma_migrations _prisma_migrations_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public._prisma_migrations DROP CONSTRAINT _prisma_migrations_pkey;
       public            postgres    false    215            �           2606    65609 ^   b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy"
    ADD CONSTRAINT "b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy" DROP CONSTRAINT "b7ae80ed-34dc-4585-9e66-1b0aca706013_vacancy_pkey";
       public            postgres    false    229            �           2606    65595 ^   b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy"
    ADD CONSTRAINT "b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy" DROP CONSTRAINT "b9bdef66-9876-413d-a381-41ce6beb2f10_vacancy_pkey";
       public            postgres    false    227            �           2606    65602 ^   d59df63e-a644-487d-8838-91ddb1896649_vacancy d59df63e-a644-487d-8838-91ddb1896649_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."d59df63e-a644-487d-8838-91ddb1896649_vacancy"
    ADD CONSTRAINT "d59df63e-a644-487d-8838-91ddb1896649_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."d59df63e-a644-487d-8838-91ddb1896649_vacancy" DROP CONSTRAINT "d59df63e-a644-487d-8838-91ddb1896649_vacancy_pkey";
       public            postgres    false    228            �           2606    65560 ^   e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy"
    ADD CONSTRAINT "e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy_pkey" PRIMARY KEY (id);
 �   ALTER TABLE ONLY public."e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy" DROP CONSTRAINT "e63dc258-40f0-4745-a2ea-556ed9707bc7_vacancy_pkey";
       public            postgres    false    222            �           2606    53624    profiles profiles_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.profiles DROP CONSTRAINT profiles_pkey;
       public            postgres    false    219            �           2606    53424    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            postgres    false    216            �           1259    53625    profiles_user_id_key    INDEX     S   CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id);
 (   DROP INDEX public.profiles_user_id_key;
       public            postgres    false    219            �           1259    53431    tokens_token_key    INDEX     K   CREATE UNIQUE INDEX tokens_token_key ON public.tokens USING btree (token);
 $   DROP INDEX public.tokens_token_key;
       public            postgres    false    217            �           1259    53430    users_email_key    INDEX     I   CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
 #   DROP INDEX public.users_email_key;
       public            postgres    false    216            �           2606    53437    tokens tokens_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT "tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
 E   ALTER TABLE ONLY public.tokens DROP CONSTRAINT "tokens_userId_fkey";
       public          postgres    false    216    3273    217            w   T  x��ko��?o~�HU� ��s�XB(��&!�TU%��'�������C.�R
�VMiHJ�/�
��8��_0����sf�����LЌdUI6+��������s0�kIi�|{f�g��nug����Q���:�~�ln~��'��8^X���Kc�Zӭ����y�WKQ������ȼ�t���i|T�~��	�ub_�����'��b�	O�㹹xk���{c1j������ƅ�����뱢��No9�1"z1S��Vg1jDX�&��㘌#2Ď`$�R�F�q�6�>�1�	D��?���16�մ��+[9��Qk)^�:Q��F1�~������nl��#
N6�(Ө��'8v�;��i�_�z���ɪ�U�7�뿟'%M&w��mx�)���<��#
�yIxZi���D�|x�-Eᛋ~r����M.-.�[�`�w���}�����X�Ъ'�M(�FxP9R^P����}�*7�eI�܂ׯ7������ 6�Z�����6�À���e��V/�,�/�wM����(�!��5��,�����Z��-D�`2jM���Vܾe��]_9۟L^���W9����Nb���b�&8=䒁®��K�㫭�R4=��uz��h�xp�;��h*�UA>l�q.BMpʇ!T��9�|d�0��K����fz�)��z3^-��6Z�OQz�|���J�>^��%t�/��v>Jl�%�T�TŇ�qJCA��a`�S���1$�s�TN���G6����;�����
$Y��E�mV��j*0F�?3�TN�N���~+���Q�J�?�Sˋq4�M�ʢ���1G,DԐ�a��Ra�������	�Ƀd�֏֒��5��p�T��o�B&RhHi�@3b74�!^�)4-P�ʇb74�i�'ɕT����tI�N���[z��:E�$煪Q,�0Ʊ1��H�8nLE�v�?6ZT�v?��W9�s�8j��^�཯H���P�s��ʄX`_G)���&JW�W�<Yk5K6��`�#� `5N t@��;�pi@��� I&��Ҁj��V��[.4�,?�t�����XY��ʫ��V��V����-yWB]�m��8���Y�9aR�p���C���/U�r�ؿY���N=�������t O��Y�m�|�L��G�J���M�pUT/�8��;��T9%�c�7\�X��YG"�1�侳}�Gwn��
`�����o�'�{��؛.�@�z2�T�S_;8h�9Kq�����'�[����gځ���%�"��7Ȳ�vnT��dٮ��r�Zkj��^�(U�"+H�G3�ۧ�D
�50�86����Ȍ������RI�ﶻ���/��ɟ��<�+��ZȒȤmzQ�b{����te}
���j`�����6�;ۊR*U�eD!��)#xf���ʄ���J����c��C�O�;<��a��%�~���{U��`�/Q�j|�j��<�NV�	�y�[�A!I֌uY�T� ��� aJ����Vu�I���}����@3
�NJm�}x\��6I6� ��m`��63=��6ӿ�v{����?�*b��"�"�5ۧH���������K�^y͇K1������:b3w
NO?{�(�S�.��D��f�m�Sx���%�¤P#d��4�|H�ž���9�tq���������v�fL���W��Dc�;�x��	��g � ���\m%O������B.��h;$�^"�%"�q.j��{���1]_���ߓO�'���n�7\�R
��j��vP �n�x��̰`v}�ľ 4�?w��=�rb��.4*`	��c2�nT�
	jz`��7�F\��^����ٓ���
"D����b&A"����Iȏ��.����X*��-fC0�l%+6����6��lBt�[WoK���.�%8����Z?g-m��q���̽]���g�YE"+�r�?��Q��1�,.��)��MF
���`����r�l��W
.+l��8�%�R;;F�E����m�ŋ��NLM����B�x9��
c!��JY�/�IV�d�$_�$��[��^�j�;Ltg���@�R����o��8��w�|ci=�.x`���T;��Ϭ��-���� 6�aL����?!\�R�I�
f��W)��dG������|G�yfJ����F��2�R�7N�����?I�W���3�ф�}��n��4c�`�b���)��2���d{v.��FFT��@� =|4��%���r�T��8=WRj���S4�I��~�̛��&��U��4�#�l�Q��m����ɩ>hX���q����HD*^�p�($��Ƅi!����S9���N{a1
N�g�q��5�Lh]2R&��8 ٸ؏�.<��e��.,����I��_{����M{#u�%��r~ϔ�ؓ	m�o0��r<��f�����jXwl�����4�]k�o%��x�1ʋ己q��(EX�{��iug���tumئ��_���U�`�q��Y���pB�}S�O��t6�y�ɥ˻���kk�9LC����=NyɘS���q�F2?.3St�z>���鹬��ȫ��=E��:�<��]�',Q��{
O�mx����j��T��#�������UcT/��46v���'*������\���[�Q7��\�Ὶŭ�~2x�=at�7?��1�^g)n��ރ|X@>������i�E�9���b�(s]�]���u��Ǟ�m�8ccA8$x�~�J����J�p���;Xr%'�rdg��ܛjcEtY.�@��Dn��q��]_�>�"0��L�Կq��n�JgS�'/}	Щe͢�����:��?+D#U��P�:��r�p�_�F�]]�H�<躹~�Lԛ���Խ�S��l��}8�u�ݗ���_J�Q�Z���֜k�X��6\X�dҦ�]<4S\��`Gu����L�S���wЦf֣lڡ���M�s�W�Y{6�+����s�ONLN�����
J�f%�i7`C䥺�<0�/�~~X���;n�!ӂZ)F��Q������3��X߮�;�c��m4�E��Z��V����F�>-[��ܙK��ϧ��dpl>�8\*�F�V���W3��1<�k՛�Y�N������UA%�B�`μ	���L������q
��CsE棬RA|Q
��+�J����p<"�P㈢5\���ne��L�,M��[���>�'3�{����V}F�n6�)��)3�eO�n[���s6���T8�y1�	Q#u97����޶�fnB#�>����ç�� PE˅�:$�]s�5����K��;T8�7��D�YF��#�ݴ}s{��6 �X����$i�)���������_A�!��_(9�|*(NB��}3q\l�q���ݼA6$�D�~s�)(n����xP��M�ìw\�3�M�|����n½�ۮw#��`�m����ÿ�:q{��+r����D�\[�\���q�����`�=�zt98���,ƭ�Y�	����7�_�kkD
�]-2�B<<���w��L��%+�zUn�W{���##�"�����$�e8�~��̶Y{hf�1�Zz��/^���yCj�vB��Q�g8�d��5��,㜡�P���[ͥ>���ȑ#��pO�      |      x������ � �      }      x������ � �      z      x������ � �      x      x������ � �      {      x������ � �      r   �  x�}��j]9��<E��Y�����l�mh')I:�?:=z�p`c6؂�i-i���eҀ"���X�;��"�T�Dʣ��X�a�ֺG�ڜ*q(�Q)�M�Zx��
��D@R�
����{�n��o	��x|z|;}���]��^�ҹ�Z*dT�껈o(c�Q��\�)���E�0�)6����`n�( m����Z��pO�����p]�R�����r|���?��-{g���\�"���D�՗��䤮2�,6��1����ω<9b���3da�t�-�q��1�
SF���$���ߖ�����%�nQ�5���
�K>L�6���,��49���3-�cd�%H�(��@Ծv�	)��Ric:V��!{_U��*���

P��gCnAtb��.h�Tʖ$�^L�J
ڴ� �x�űla��۝�	rZ���c���d��Z��``>�!��%�?!_�������I��mx�B��f<J�݋�Q���(������g�sF�C{��*u���+��h�Z�3G�G[N>7V���**@�Պ�*�?(_���y~�u��E+_8�G���l�\M2w���Hm��]S4���b����v.�ǪfT[���rAyZ֚��i��t���
{�z]r=�s!g���x���u~��:ť�v�P|�������NG      �      x������ � �      ~      x������ � �            x������ � �      y      x������ � �      v   �  x���An1��3��<ώ�ę5�@BI�Т�V�Q��p�=���!��(�l������������������eY�׻�X���/�)�[�\+��5(q�0"j�%/� 0��{��5���Rx�AMg&���{L5��:&�+J;�F8)v�Rs�>b�l)�;�ɣ�c�5��0�7�I�)��G�>s�Y�`���+Y��'&�S�4�U�T�aw`������FK+	#_Sl�Iɲ2-ޟ�7��r{>?���C+��O���������ӉXҜv���s�#C�ܡ��,3H}W�˹|�><��S!�¼�Vy���J�	�c�e&>E��QD6VsJ<S��bG�ÎCc��(aWٌ�:����ނ�yIJ�Tc��榶tE���l���r���Ё�M/��;��*�y�8��5�����z���t�gD��@ZP%��n�PW3���\Q�R������O�@[�      t   ~  x���Ok�A��c���$�IޞăB��x��t��-UP��΂�z�2�@��c��t���0%�=Z���M�����ʴƸ���'���ր�00�5�̅�4������pȻ��;��n�o_܇k�q�7���{��p�7�\��"�y]���z���wݽ���x���>���[����<����ʶԙ}T��c��H���V�Hk��"B�m�v!�K��Y�WƊ���l�J����8�>�aOD���.J�1�B}~p=�2��U�U<�DE����Y���C��(=�JA L�s�F�]=�!�ao�D!��-�O4�Y���Һ�(����/��U��o��7��8�HILBቈW<���m�_D���v�Dd�      s      x�u��r�:����V�d�X1�4��&L!�K� &Lf�u��*��X���p�WGGp�j`�1�+�$2���*B����i��{��3Fχ��"�x}>��u�mh�q#�g��(�zT4�u^˚��ðy|�B��ȧ 	��_��/1������_�O׳O�i��`)�(�@�� d���P�,��Re��r��y3<2�Tt �&i�;����#bgћn֝v�'�pw��f���0Y�r�<�o��a $�
�P&�qM,Ǟֺ�rUʙŗ�c�_���<��Tm��?�j����UUU��P��)x���A��WC�/에_bތ�5f��3�h�e ��0�3#(xƘ����� ���P����~�c�I\�X�H~H��4���&�ߪ�e�C��0X��������*�
�g�0�&��1�(%�jn}�Z[v�*�����"1��b�f_O�
�(^W���M#>�D���ÈNV�� ?�?��;���� ��G����M3s̾'H��@Q�A�9F, J�N���U�G�ł�N��.{�%�Z�:o�����6�Utou���l��9lWk�J�J�������Y�@"# �r'n���o9bKN�w�\�.We��/�ּ^��E_�d�E�Yǳ�%�K��'����a7��
����!%�J>���%��Ś�h��7&n!}�t�����\v�*_��L�����9��l�)z�q]L�|�m�"j��۩�7��8��5��i|��"��?�!����g���)΋u�U�|���Z��.o����}uo�EU�m��!�ݨ����� DGj�ze�n�3�'�4��Ɂ������0i��LwΔ*� Hl��B�����rUV�6-rZ��6ڛx<7:��C}�Lv�g�rfE���اy�y�N���NC��q�y���e�fej4�L0 37Z�P�� q���X,�.We�_���:�j���8����2�bU���:Եzv��16fRtHgu�%�4�o�Q��������     