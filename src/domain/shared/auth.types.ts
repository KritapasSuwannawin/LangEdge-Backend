export interface DecodedToken {
  readonly uid: string;
  readonly user_id?: string;
  readonly email?: string;
  readonly name?: string;
  readonly picture?: string;
}
