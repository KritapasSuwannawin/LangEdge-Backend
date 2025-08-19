import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateToTypeorm1755627556159 implements MigrationInterface {
    name = 'MigrateToTypeorm1755627556159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "fk_last_used_language_id"`);
        await queryRunner.query(`ALTER TABLE "language" DROP CONSTRAINT "language_name_check"`);
        await queryRunner.query(`ALTER TABLE "language" DROP CONSTRAINT "language_code_check"`);
        await queryRunner.query(`ALTER TABLE "synonym" DROP CONSTRAINT "synonym_text_language_id_key"`);
        await queryRunner.query(`ALTER TABLE "example_sentence" DROP CONSTRAINT "example_sentence_text_language_id_output_language_id_key"`);
        await queryRunner.query(`ALTER TABLE "translation" DROP CONSTRAINT "translation_input_text_input_language_id_output_language_id_key"`);
        await queryRunner.query(`ALTER TABLE "language" DROP COLUMN "supported_by"`);
        await queryRunner.query(`ALTER TABLE "synonym" DROP CONSTRAINT "synonym_pkey"`);
        await queryRunner.query(`ALTER TABLE "synonym" ADD CONSTRAINT "synonym_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "example_sentence" DROP CONSTRAINT "example_sentence_pkey"`);
        await queryRunner.query(`ALTER TABLE "example_sentence" ADD CONSTRAINT "example_sentence_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "translation" DROP CONSTRAINT "translation_pkey"`);
        await queryRunner.query(`ALTER TABLE "translation" ADD CONSTRAINT "translation_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "language" ADD CONSTRAINT "CHK_7a57a1b23924cce6533a9b5adb" CHECK (code ~ '^[a-z]{2}$')`);
        await queryRunner.query(`ALTER TABLE "language" ADD CONSTRAINT "CHK_e64482c0f8a94fafcab68771e8" CHECK (name ~ '^[A-Z][a-z]+$')`);
        await queryRunner.query(`ALTER TABLE "synonym" ADD CONSTRAINT "UQ_fcff5abcd9706165ac485036aa0" UNIQUE ("text", "language_id")`);
        await queryRunner.query(`ALTER TABLE "example_sentence" ADD CONSTRAINT "UQ_67f6a9b491af9eb7299a288b0ec" UNIQUE ("text", "language_id", "output_language_id")`);
        await queryRunner.query(`ALTER TABLE "translation" ADD CONSTRAINT "UQ_f68c0af907f8a6183b1f9e5fe02" UNIQUE ("input_text", "input_language_id", "output_language_id")`);
        await queryRunner.query(`ALTER TABLE "synonym" ADD CONSTRAINT "FK_a3edbc0d7a7af33955cfd602835" FOREIGN KEY ("language_id") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_a1ca2711002397dfd73dc3ee86b" FOREIGN KEY ("last_used_language_id") REFERENCES "language"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "example_sentence" ADD CONSTRAINT "FK_cb19c3a8d5ef4f0ff4febbdf1ed" FOREIGN KEY ("language_id") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "example_sentence" ADD CONSTRAINT "FK_f030332de458ed02e5496f94b43" FOREIGN KEY ("output_language_id") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "translation" ADD CONSTRAINT "FK_9f6e923c9269ef723ab9465d9fa" FOREIGN KEY ("input_language_id") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "translation" ADD CONSTRAINT "FK_8537ea9c853f0429c0e9ae2644c" FOREIGN KEY ("output_language_id") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "translation" DROP CONSTRAINT "FK_8537ea9c853f0429c0e9ae2644c"`);
        await queryRunner.query(`ALTER TABLE "translation" DROP CONSTRAINT "FK_9f6e923c9269ef723ab9465d9fa"`);
        await queryRunner.query(`ALTER TABLE "example_sentence" DROP CONSTRAINT "FK_f030332de458ed02e5496f94b43"`);
        await queryRunner.query(`ALTER TABLE "example_sentence" DROP CONSTRAINT "FK_cb19c3a8d5ef4f0ff4febbdf1ed"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_a1ca2711002397dfd73dc3ee86b"`);
        await queryRunner.query(`ALTER TABLE "synonym" DROP CONSTRAINT "FK_a3edbc0d7a7af33955cfd602835"`);
        await queryRunner.query(`ALTER TABLE "translation" DROP CONSTRAINT "UQ_f68c0af907f8a6183b1f9e5fe02"`);
        await queryRunner.query(`ALTER TABLE "example_sentence" DROP CONSTRAINT "UQ_67f6a9b491af9eb7299a288b0ec"`);
        await queryRunner.query(`ALTER TABLE "synonym" DROP CONSTRAINT "UQ_fcff5abcd9706165ac485036aa0"`);
        await queryRunner.query(`ALTER TABLE "language" DROP CONSTRAINT "CHK_e64482c0f8a94fafcab68771e8"`);
        await queryRunner.query(`ALTER TABLE "language" DROP CONSTRAINT "CHK_7a57a1b23924cce6533a9b5adb"`);
        await queryRunner.query(`ALTER TABLE "translation" DROP CONSTRAINT "translation_pkey"`);
        await queryRunner.query(`ALTER TABLE "translation" ADD CONSTRAINT "translation_pkey" PRIMARY KEY ("id", "input_language_id")`);
        await queryRunner.query(`ALTER TABLE "example_sentence" DROP CONSTRAINT "example_sentence_pkey"`);
        await queryRunner.query(`ALTER TABLE "example_sentence" ADD CONSTRAINT "example_sentence_pkey" PRIMARY KEY ("id", "language_id")`);
        await queryRunner.query(`ALTER TABLE "synonym" DROP CONSTRAINT "synonym_pkey"`);
        await queryRunner.query(`ALTER TABLE "synonym" ADD CONSTRAINT "synonym_pkey" PRIMARY KEY ("id", "language_id")`);
        await queryRunner.query(`ALTER TABLE "language" ADD "supported_by" text array NOT NULL DEFAULT '{gpt-4o-mini}'`);
        await queryRunner.query(`ALTER TABLE "translation" ADD CONSTRAINT "translation_input_text_input_language_id_output_language_id_key" UNIQUE ("input_text", "input_language_id", "output_language_id")`);
        await queryRunner.query(`ALTER TABLE "example_sentence" ADD CONSTRAINT "example_sentence_text_language_id_output_language_id_key" UNIQUE ("text", "language_id", "output_language_id")`);
        await queryRunner.query(`ALTER TABLE "synonym" ADD CONSTRAINT "synonym_text_language_id_key" UNIQUE ("text", "language_id")`);
        await queryRunner.query(`ALTER TABLE "language" ADD CONSTRAINT "language_code_check" CHECK ((code ~ '^[a-z]{2}$'::text))`);
        await queryRunner.query(`ALTER TABLE "language" ADD CONSTRAINT "language_name_check" CHECK ((name ~ '^[A-Z][a-z]+$'::text))`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "fk_last_used_language_id" FOREIGN KEY ("last_used_language_id") REFERENCES "language"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

}
